import { Hono } from "hono";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { cacheStats } from "../lib/cache.js";
import { getExecutionStats, getActiveBackend, setActiveBackend, type ExecutionBackend } from "../services/executionDispatcher.js";
import { createNotification } from "../services/notificationService.js";
import { detectPlagiarism, type SubmissionInput } from "../services/plagiarismDetector.js";
import { getAllSessions } from "../services/socketServer.js";
import { createChildLogger } from "../lib/logger.js";
import type { AuthUser } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";

const log = createChildLogger({ module: "system" });

const system = new Hono<AppEnv>();

// ── GET /system/health ────────────────────────────────────────────────
// Public endpoint — no auth required
system.get("/health", async (c) => {
  let dbOk = false;
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("profiles").select("user_id", { count: "exact", head: true });
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const memUsage = process.memoryUsage();
  const execStats = await getExecutionStats();

  // Overall status considers both DB and code execution service
  const codeExecDegraded =
    execStats.activeBackend === "programiz" &&
    execStats.programiz.circuitBreaker.state !== "GOOD";
  const judge0Down =
    execStats.activeBackend === "judge0" &&
    execStats.judge0.available === false;

  let status: string;
  if (!dbOk) status = "degraded";
  else if (codeExecDegraded || judge0Down) status = "degraded";
  else status = "healthy";

  return sendSuccess(c, {
    status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbOk ? "connected" : "disconnected",
    codeExecution: execStats,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    },
    cache: cacheStats(),
    nodeVersion: process.version,
  });
});

// All routes below require auth + admin
system.use("/*", authMiddleware);

// ── GET /system/logs ──────────────────────────────────────────────────
system.get("/logs", requireRole("admin"), async (c) => {
  const supabase = getSupabaseAdmin();
  const limit = Math.min(parseInt(c.req.query("limit") ?? "100"), 500);
  const action = c.req.query("action");
  const userId = c.req.query("userId");

  let query = supabase
    .from("activity_logs")
    .select(`
      *,
      profiles!activity_logs_user_id_fkey(name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action) query = query.eq("action", action);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: (row as any).profiles?.name ?? "",
    userEmail: (row as any).profiles?.email ?? "",
    action: row.action,
    details: row.details,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  })));
});

// ── POST /system/backups ───────────────────────────────────────────────
system.post("/backups", requireRole("admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const body = await c.req.json().catch(() => null);
  const name = body?.name;
  const type = body?.type ?? "full";
  const includes = body?.includes ?? [];

  if (!name || typeof name !== "string") {
    return sendError(c, 400, "name is required");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("backups")
    .insert({
      name,
      type,
      includes,
      status: "completed",
      size: 0,
      created_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return sendError(c, 500, error.message);

  // Notify admin that backup completed (fire-and-forget)
  createNotification({
    userId: user.id,
    title: "Backup Completed",
    message: `Backup "${name}" has been created successfully.`,
    type: "system",
  });

  return sendSuccess(c, {
    id: data.id,
    name: data.name,
    type: data.type,
    size: data.size,
    status: data.status,
    includes: data.includes,
    createdBy: data.created_by,
    createdAt: data.created_at,
    completedAt: data.completed_at,
  }, 201);
});

// ── DELETE /system/backups/:id ─────────────────────────────────────────
system.delete("/backups/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("backups").delete().eq("id", id);
  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, { message: "Backup deleted" });
});

// ── PUT /system/plagiarism/:id/review ─────────────────────────────────
system.put("/plagiarism/:id/review", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const status = body?.status;

  if (!status || !["cleared", "confirmed"].includes(status)) {
    return sendError(c, 400, "status must be 'cleared' or 'confirmed'");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("plagiarism_results")
    .update({
      status,
      flagged: status === "confirmed",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, {
    id: data.id,
    status: data.status,
    flagged: data.flagged,
    reviewedBy: data.reviewed_by,
    reviewedAt: data.reviewed_at,
  });
});

// ── POST /system/plagiarism/scan/:assessmentId ────────────────────────
// Triggers server-side winnowing plagiarism scan for all submissions in an assessment.
// Groups submissions by question, runs pairwise comparison, persists results.
system.post("/plagiarism/scan/:assessmentId", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const assessmentId = c.req.param("assessmentId");
  const body = await c.req.json().catch(() => null);
  const sensitivity: "low" | "medium" | "high" = body?.sensitivity ?? "medium";

  if (!["low", "medium", "high"].includes(sensitivity)) {
    return sendError(c, 400, "sensitivity must be 'low', 'medium', or 'high'");
  }

  const supabase = getSupabaseAdmin();

  // Verify assessment exists
  const { data: assessment, error: aErr } = await supabase
    .from("assessments")
    .select("id, title, settings")
    .eq("id", assessmentId)
    .single();

  if (aErr || !assessment) return sendError(c, 404, "Assessment not found");

  // Fetch all submissions for this assessment with student info
  const { data: submissions, error: sErr } = await supabase
    .from("submissions")
    .select("id, student_id, question_id, code, language, profiles!submissions_student_id_fkey(name)")
    .eq("assessment_id", assessmentId);

  if (sErr) return sendError(c, 500, sErr.message);
  if (!submissions || submissions.length < 2) {
    return sendSuccess(c, {
      message: "Not enough submissions to compare",
      results: [],
      summary: { totalPairs: 0, flaggedStudents: 0, maxSimilarity: 0 },
    });
  }

  // Group submissions by question_id
  const byQuestion = new Map<string, SubmissionInput[]>();
  for (const sub of submissions) {
    const questionId = sub.question_id;
    if (!questionId) continue;
    const existing = byQuestion.get(questionId) || [];
    existing.push({
      id: sub.id,
      studentId: sub.student_id,
      studentName: (sub as any).profiles?.name ?? "Unknown",
      code: sub.code ?? "",
      language: sub.language ?? "python",
      questionId,
    });
    byQuestion.set(questionId, existing);
  }

  // Delete previous results for this assessment before inserting new ones
  await supabase.from("plagiarism_results").delete().eq("assessment_id", assessmentId);

  // Run detection per question and persist results
  const allResults: any[] = [];
  const allFlaggedStudents = new Set<string>();
  let maxSimilarity = 0;

  for (const [questionId, questionSubmissions] of byQuestion) {
    if (questionSubmissions.length < 2) continue;

    const detection = detectPlagiarism(questionSubmissions, { sensitivity });

    for (const pair of detection.pairs) {
      if (pair.similarity > maxSimilarity) maxSimilarity = pair.similarity;

      const flagged = detection.flaggedStudentIds.has(pair.studentIdA) ||
                      detection.flaggedStudentIds.has(pair.studentIdB);

      // Build per-student name lookup
      const nameA = questionSubmissions.find(s => s.studentId === pair.studentIdA)?.studentName ?? "Unknown";
      const nameB = questionSubmissions.find(s => s.studentId === pair.studentIdB)?.studentName ?? "Unknown";

      // Insert a result for student A
      const resultA = {
        assessment_id: assessmentId,
        submission_id: pair.submissionIdA,
        student_id: pair.studentIdA,
        student_name: nameA,
        question_id: questionId,
        similarity_score: pair.similarity,
        flagged,
        status: "pending",
        matched_submissions: [{
          submissionId: pair.submissionIdB,
          studentId: pair.studentIdB,
          studentName: nameB,
          similarity: pair.similarity,
          matchedRegions: pair.matchedRegions,
        }],
      };

      // Insert a result for student B
      const resultB = {
        assessment_id: assessmentId,
        submission_id: pair.submissionIdB,
        student_id: pair.studentIdB,
        student_name: nameB,
        question_id: questionId,
        similarity_score: pair.similarity,
        flagged,
        status: "pending",
        matched_submissions: [{
          submissionId: pair.submissionIdA,
          studentId: pair.studentIdA,
          studentName: nameA,
          similarity: pair.similarity,
          matchedRegions: pair.matchedRegions,
        }],
      };

      allResults.push(resultA, resultB);
      if (flagged) {
        allFlaggedStudents.add(pair.studentIdA);
        allFlaggedStudents.add(pair.studentIdB);
      }
    }
  }

  // Batch insert results
  if (allResults.length > 0) {
    const { error: insertErr } = await supabase
      .from("plagiarism_results")
      .insert(allResults);

    if (insertErr) {
      log.error({ err: insertErr, assessmentId }, "plagiarism_results insert error");
      return sendError(c, 500, "Failed to persist plagiarism results: " + insertErr.message);
    }
  }

  // Log the scan
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "plagiarism_scan",
    details: {
      assessmentId,
      sensitivity,
      submissionCount: submissions.length,
      resultCount: allResults.length,
      flaggedStudents: allFlaggedStudents.size,
    },
    ip_address: c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
  }).then(({ error: logErr }) => {
    if (logErr) log.error({ err: logErr }, "activity_log insert failed");
  });

  // Fetch persisted results to return
  const { data: persisted } = await supabase
    .from("plagiarism_results")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("similarity_score", { ascending: false });

  return sendSuccess(c, {
    message: `Plagiarism scan complete. ${allResults.length} result(s) found.`,
    results: (persisted ?? []).map(mapPlagiarismRow),
    summary: {
      totalPairs: allResults.length,
      flaggedStudents: allFlaggedStudents.size,
      maxSimilarity: Math.round(maxSimilarity * 100) / 100,
    },
  }, 201);
});

// ── GET /system/plagiarism/:assessmentId ──────────────────────────────
// Returns plagiarism results for an assessment.
system.get("/plagiarism/:assessmentId", requireRole("teacher", "admin"), async (c) => {
  const assessmentId = c.req.param("assessmentId");
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("plagiarism_results")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("similarity_score", { ascending: false });

  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, (data ?? []).map(mapPlagiarismRow));
});

// Helper: map DB row → API response shape
function mapPlagiarismRow(row: any) {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    submissionId: row.submission_id,
    studentId: row.student_id,
    studentName: row.student_name,
    questionId: row.question_id,
    similarityScore: row.similarity_score,
    flagged: row.flagged,
    status: row.status,
    matchedSubmissions: row.matched_submissions ?? [],
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

// ── GET /system/stats ─────────────────────────────────────────────────
system.get("/stats", requireRole("admin"), async (c) => {
  const supabase = getSupabaseAdmin();

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalAssessments },
    { count: activeAssessments },
    { count: totalSubmissions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("assessments").select("*", { count: "exact", head: true }),
    supabase.from("assessments").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("submissions").select("*", { count: "exact", head: true }),
  ]);

  // Fetch leaderboard (top 20 students by total score) and active sessions
  const [{ data: leaderboardRows }, { data: sessionRows }] = await Promise.all([
    supabase
      .from("submissions")
      .select("student_id, score, profiles!submissions_student_id_fkey(name, department)")
      .in("status", ["accepted", "partial"])
      .order("score", { ascending: false })
      .limit(200),
    supabase
      .from("active_sessions")
      .select("id, user_id, last_active_at, profiles!active_sessions_user_id_fkey(name)")
      .order("last_active_at", { ascending: false })
      .limit(50),
  ]);

  // Aggregate leaderboard: sum scores per student, rank by total
  const studentScores = new Map<string, { name: string; department: string; totalScore: number; problemsSolved: number }>();
  for (const row of leaderboardRows ?? []) {
    const sid = row.student_id;
    const existing = studentScores.get(sid);
    const profile = (row as any).profiles;
    if (existing) {
      existing.totalScore += row.score ?? 0;
      existing.problemsSolved += 1;
    } else {
      studentScores.set(sid, {
        name: profile?.name ?? "Unknown",
        department: profile?.department ?? "",
        totalScore: row.score ?? 0,
        problemsSolved: 1,
      });
    }
  }
  const leaderboard = [...studentScores.entries()]
    .sort((a, b) => b[1].totalScore - a[1].totalScore)
    .slice(0, 20)
    .map(([id, s], idx) => ({
      rank: idx + 1,
      id,
      name: s.name,
      avatar: s.name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase(),
      department: s.department,
      totalScore: s.totalScore,
      problemsSolved: s.problemsSolved,
      averageTime: 0,
      streak: 0,
      badges: [],
    }));

  const activeSessions = (sessionRows ?? []).map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    userName: s.profiles?.name ?? "Unknown",
    lastActiveAt: s.last_active_at,
  }));

  return sendSuccess(c, {
    users: { total: totalUsers ?? 0, active: activeUsers ?? 0 },
    assessments: { total: totalAssessments ?? 0, active: activeAssessments ?? 0 },
    submissions: { total: totalSubmissions ?? 0 },
    leaderboard,
    activeSessions,
    cache: cacheStats(),
    memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// ── GET /system/execution-backend ──────────────────────────────────────
system.get("/execution-backend", requireRole("admin"), async (c) => {
  const stats = await getExecutionStats();
  return sendSuccess(c, stats);
});

// ── PUT /system/execution-backend ─────────────────────────────────────
system.put("/execution-backend", requireRole("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const backend = body?.backend;

  if (backend !== "programiz" && backend !== "judge0") {
    return sendError(c, 400, 'backend must be "programiz" or "judge0"');
  }

  try {
    setActiveBackend(backend as ExecutionBackend);
  } catch (err) {
    return sendError(c, 400, err instanceof Error ? err.message : String(err));
  }

  // Log the toggle
  const user = c.get("user") as AuthUser;
  const supabase = getSupabaseAdmin();
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "admin_switch_execution_backend",
    details: { backend },
    ip_address: c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
  }).then(({ error: logErr }) => {
    if (logErr) log.error({ err: logErr }, "activity_log insert failed");
  });

  return sendSuccess(c, {
    activeBackend: backend,
    message: `Execution backend switched to ${backend}`,
  });
});

// ============================================================
// Monitoring Endpoints
// ============================================================

// ── GET /system/monitoring/:assessmentId/events ─────────────────────
// Fetch persisted monitoring events for an assessment (teacher/admin only)
system.get("/monitoring/:assessmentId/events", requireRole("teacher", "admin"), async (c) => {
  const assessmentId = c.req.param("assessmentId");
  const eventType = c.req.query("type"); // optional filter
  const limit = Math.min(parseInt(c.req.query("limit") ?? "200", 10), 1000);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("monitoring_events")
    .select("*", { count: "exact" })
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  const { data, error, count } = await query;
  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, {
    events: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
});

// ── POST /system/monitoring/:assessmentId/events ────────────────────
// Log a monitoring event via REST (standard mode fallback).
// Students can log their own violations when WebSocket is not active.
system.post("/monitoring/:assessmentId/events", async (c) => {
  const user = c.get("user") as AuthUser;
  const assessmentId = c.req.param("assessmentId");

  const body = await c.req.json().catch(() => null);
  if (!body || !body.attemptId || !body.eventType) {
    return sendError(c, 400, "Missing required fields: attemptId, eventType");
  }

  const validEventTypes = ["heartbeat", "violation", "join", "leave"];
  if (!validEventTypes.includes(body.eventType)) {
    return sendError(c, 400, `Invalid eventType. Must be one of: ${validEventTypes.join(", ")}`);
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("monitoring_events").insert({
    attempt_id: body.attemptId,
    assessment_id: assessmentId,
    student_id: user.id,
    event_type: body.eventType,
    payload: body.payload ?? {},
  });

  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, { logged: true }, 201);
});

// ── GET /system/monitoring/:assessmentId/sessions ───────────────────
// Get current live sessions from in-memory WebSocket store (admin only)
system.get("/monitoring/:assessmentId/sessions", requireRole("teacher", "admin"), async (c) => {
  const assessmentId = c.req.param("assessmentId");

  const all = getAllSessions();
  const assessmentSessions = all.filter(s => s.assessmentId === assessmentId);

  return sendSuccess(c, {
    sessions: assessmentSessions,
    count: assessmentSessions.length,
  });
});

// ── GET /system/monitoring/:assessmentId/summary ────────────────────
// Get violation summary for an assessment (aggregated from persisted events)
system.get("/monitoring/:assessmentId/summary", requireRole("teacher", "admin"), async (c) => {
  const assessmentId = c.req.param("assessmentId");
  const supabase = getSupabaseAdmin();

  // Fetch all violation events for this assessment
  const { data: violations, error } = await supabase
    .from("monitoring_events")
    .select("student_id, payload")
    .eq("assessment_id", assessmentId)
    .eq("event_type", "violation");

  if (error) return sendError(c, 500, error.message);

  // Aggregate by student
  const byStudent = new Map<string, { total: number; types: Record<string, number> }>();
  for (const v of violations ?? []) {
    const existing = byStudent.get(v.student_id) ?? { total: 0, types: {} };
    existing.total++;
    const vType = (v.payload as Record<string, unknown>)?.type as string ?? 'unknown';
    existing.types[vType] = (existing.types[vType] ?? 0) + 1;
    byStudent.set(v.student_id, existing);
  }

  const students = Array.from(byStudent.entries()).map(([studentId, data]) => ({
    studentId,
    ...data,
  }));

  // Sort by total violations descending
  students.sort((a, b) => b.total - a.total);

  return sendSuccess(c, {
    assessmentId,
    totalViolations: violations?.length ?? 0,
    studentsWithViolations: students.length,
    students,
  });
});

export default system;
