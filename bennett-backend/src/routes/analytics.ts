import { Hono } from "hono";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { cacheGet, cacheSet } from "../lib/cache.js";
import type { AuthUser } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";

const analytics = new Hono<AppEnv>();
analytics.use("*", authMiddleware);

// ── GET /analytics/dashboard ──────────────────────────────────────────
analytics.get("/dashboard", requireRole("teacher", "admin"), async (c) => {
  const cacheKey = "analytics:dashboard";
  const cached = cacheGet(cacheKey);
  if (cached) return sendSuccess(c, cached);

  const supabase = getSupabaseAdmin();

  let dashboardData;
  try {
    const [
      { count: totalStudents },
      { count: totalTeachers },
      { count: totalQuestions },
      { count: totalAssessments },
      { count: totalSubmissions },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("questions").select("*", { count: "exact", head: true }),
      supabase.from("assessments").select("*", { count: "exact", head: true }),
      supabase.from("submissions").select("*", { count: "exact", head: true }),
    ]);

    dashboardData = {
      totalStudents: totalStudents ?? 0,
      totalTeachers: totalTeachers ?? 0,
      totalQuestions: totalQuestions ?? 0,
      totalAssessments: totalAssessments ?? 0,
      totalSubmissions: totalSubmissions ?? 0,
    };
  } catch (err) {
    return sendError(c, 500, "Failed to fetch dashboard statistics");
  }

  cacheSet(cacheKey, dashboardData, 60);
  return sendSuccess(c, dashboardData);
});

// ── GET /analytics/leaderboard ────────────────────────────────────────
analytics.get("/leaderboard", async (c) => {
  const assessmentId = c.req.query("assessmentId");
  // Clamp limit to standard buckets to prevent cache key explosion
  const rawLimit = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const limit = [10, 25, 50, 100].find((b) => rawLimit <= b) ?? 50;

  const cacheKey = `analytics:leaderboard:${assessmentId ?? "all"}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return sendSuccess(c, cached);

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("assessment_attempts")
    .select(`
      student_id,
      score,
      max_score,
      profiles!assessment_attempts_student_id_fkey(name, avatar_url, department)
    `)
    .eq("status", "completed")
    .order("score", { ascending: false })
    .limit(limit);

  if (assessmentId) {
    query = query.eq("assessment_id", assessmentId);
  }

  const { data, error } = await query;
  if (error) return sendError(c, 500, error.message);

  const leaderboard = (data ?? []).map((row, index) => ({
    rank: index + 1,
    studentId: row.student_id,
    name: (row as any).profiles?.name ?? "Unknown",
    avatar: (row as any).profiles?.avatar_url ?? "",
    department: (row as any).profiles?.department ?? "",
    score: row.score,
    maxScore: row.max_score,
  }));

  cacheSet(cacheKey, leaderboard, 60);
  return sendSuccess(c, leaderboard);
});

// ── GET /analytics/student/:id ────────────────────────────────────────
analytics.get("/student/:id", async (c) => {
  const user = c.get("user") as AuthUser;
  const studentId = c.req.param("id");

  // Students can only see own stats
  if (user.role === "student" && user.id !== studentId) {
    return sendError(c, 403, "Access denied");
  }

  const supabase = getSupabaseAdmin();

  let profile: any, attempts: any[] | null, submissions: any[] | null;
  try {
    const [profileRes, attemptsRes, submissionsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", studentId).single(),
      supabase
        .from("assessment_attempts")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("submissions")
        .select("language, score, max_score, created_at")
        .eq("student_id", studentId),
    ]);
    profile = profileRes.data;
    attempts = attemptsRes.data;
    submissions = submissionsRes.data;
  } catch (err) {
    return sendError(c, 500, "Failed to fetch student analytics");
  }

  if (!profile) return sendError(c, 404, "Student not found");

  const totalAttempts = attempts?.length ?? 0;
  const completedAttempts = attempts?.filter((a) => a.status === "completed").length ?? 0;
  const avgScore =
    completedAttempts > 0
      ? (attempts ?? [])
          .filter((a) => a.status === "completed")
          .reduce((sum, a) => sum + (a.score / (a.max_score || 1)) * 100, 0) / completedAttempts
      : 0;

  // Language breakdown
  const langMap = new Map<string, number>();
  for (const s of submissions ?? []) {
    langMap.set(s.language, (langMap.get(s.language) ?? 0) + 1);
  }

  return sendSuccess(c, {
    student: {
      id: profile.user_id,
      name: profile.name,
      email: profile.email,
      department: profile.department,
    },
    stats: {
      totalAttempts,
      completedAttempts,
      averageScore: Math.round(avgScore * 100) / 100,
      totalSubmissions: submissions?.length ?? 0,
      languageBreakdown: Object.fromEntries(langMap),
    },
    recentAttempts: (attempts ?? []).slice(0, 10).map((a) => ({
      id: a.id,
      assessmentId: a.assessment_id,
      score: a.score,
      maxScore: a.max_score,
      status: a.status,
      startedAt: a.started_at ?? a.created_at,
      completedAt: a.completed_at,
    })),
  });
});

// ── GET /analytics/assessment/:id ─────────────────────────────────────
analytics.get("/assessment/:id", requireRole("teacher", "admin"), async (c) => {
  const assessmentId = c.req.param("id");
  const supabase = getSupabaseAdmin();

  const { data: attempts, error } = await supabase
    .from("assessment_attempts")
    .select(`
      *,
      profiles!assessment_attempts_student_id_fkey(name, department)
    `)
    .eq("assessment_id", assessmentId)
    .order("score", { ascending: false });

  if (error) return sendError(c, 500, error.message);

  const completed = (attempts ?? []).filter((a) => a.status === "completed");
  const scores = completed.map((a) => a.score);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const highScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowScore = scores.length > 0 ? Math.min(...scores) : 0;

  return sendSuccess(c, {
    assessmentId,
    totalAttempts: attempts?.length ?? 0,
    completedAttempts: completed.length,
    inProgressAttempts: (attempts ?? []).filter((a) => a.status === "in-progress").length,
    averageScore: Math.round(avgScore * 100) / 100,
    highestScore: highScore,
    lowestScore: lowScore,
    students: (attempts ?? []).map((a) => ({
      studentId: a.student_id,
      name: (a as any).profiles?.name ?? "Unknown",
      department: (a as any).profiles?.department ?? "",
      score: a.score,
      maxScore: a.max_score,
      status: a.status,
      startedAt: a.started_at ?? a.created_at,
      completedAt: a.completed_at,
    })),
  });
});

export default analytics;
