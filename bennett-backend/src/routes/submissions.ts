import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseAdmin, createSupabaseClient } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { runTests } from "../services/testRunner.js";
import type { AuthUser } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";

const submissions = new Hono<AppEnv>();
submissions.use("*", authMiddleware);

const submitSchema = z.object({
  assessmentId: z.string().uuid(),
  questionId: z.string().uuid(),
  attemptId: z.string().uuid(),
  code: z.string().min(1).max(50000),
  language: z.string(),
});

// ── POST /submissions ─────────────────────────────────────────────────
submissions.post("/", requireRole("student"), async (c) => {
  const user = c.get("user") as AuthUser;
  const body = await c.req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const { assessmentId, questionId, attemptId, code, language } = parsed.data;
  const token = c.get("token") as string;
  const userDb = createSupabaseClient(token);
  const supabase = getSupabaseAdmin();

  // Use per-user client for student-scoped reads (RLS defense-in-depth)
  // Verify attempt belongs to user and is in-progress
  const { data: attempt } = await userDb
    .from("assessment_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("student_id", user.id)
    .eq("status", "in-progress")
    .single();

  if (!attempt) return sendError(c, 400, "Invalid or expired attempt");

  // Verify question belongs to this assessment
  const { data: aqLink } = await supabase
    .from("assessment_questions")
    .select("question_id")
    .eq("assessment_id", assessmentId)
    .eq("question_id", questionId)
    .single();

  if (!aqLink) return sendError(c, 400, "Question does not belong to this assessment");

  // Verify attempt is for this assessment
  if (attempt.assessment_id !== assessmentId) {
    return sendError(c, 400, "Attempt does not match this assessment");
  }

  // Get question with test cases
  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (!question) return sendError(c, 404, "Question not found");

  // Run tests
  const testResults = await runTests(code, language, question.test_cases ?? []);

  // Save submission
  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      student_id: user.id,
      assessment_id: assessmentId,
      question_id: questionId,
      attempt_id: attemptId,
      code,
      language,
      score: testResults.earnedPoints,
      max_score: testResults.totalPoints,
      tests_passed: testResults.passed,
      tests_total: testResults.totalTests,
      test_results: testResults.results,
      status: testResults.failed === 0 ? "accepted" : "partial",
    })
    .select()
    .single();

  if (error) return sendError(c, 500, error.message);

  // Update attempt score (sum up all submission scores for this attempt)
  const { data: allSubs } = await supabase
    .from("submissions")
    .select("score, question_id")
    .eq("attempt_id", attemptId);

  // Keep best score per question
  const bestScores = new Map<string, number>();
  for (const s of allSubs ?? []) {
    const current = bestScores.get(s.question_id) ?? 0;
    if (s.score > current) bestScores.set(s.question_id, s.score);
  }
  const totalScore = [...bestScores.values()].reduce((a, b) => a + b, 0);

  await supabase
    .from("assessment_attempts")
    .update({ score: totalScore, updated_at: new Date().toISOString() })
    .eq("id", attemptId);

  return sendSuccess(c, {
    id: submission.id,
    score: submission.score,
    maxScore: submission.max_score,
    testsPassed: submission.tests_passed,
    testsTotal: submission.tests_total,
    status: submission.status,
    testResults: testResults.results,
    attemptTotalScore: totalScore,
  }, 201);
});

// ── GET /submissions ──────────────────────────────────────────────────
submissions.get("/", async (c) => {
  const user = c.get("user") as AuthUser;
  const assessmentId = c.req.query("assessmentId");
  const questionId = c.req.query("questionId");
  const studentId = c.req.query("studentId");

  // Students use per-user client for RLS; teachers/admins use admin client for cross-user access
  const db = user.role === "student"
    ? createSupabaseClient(c.get("token") as string)
    : getSupabaseAdmin();
  let query = db.from("submissions").select(`
    *,
    profiles!submissions_student_id_fkey(name),
    questions!submissions_question_id_fkey(title)
  `);

  // Students can only see their own
  if (user.role === "student") {
    query = query.eq("student_id", user.id);
  } else if (user.role === "teacher") {
    // Teachers can only see submissions for assessments they created
    const { data: teacherAssessments } = await db
      .from("assessments")
      .select("id")
      .eq("created_by", user.id);
    const teacherAssessmentIds = (teacherAssessments ?? []).map(a => a.id);
    if (teacherAssessmentIds.length > 0) {
      query = query.in("assessment_id", teacherAssessmentIds);
    } else {
      return sendSuccess(c, []);
    }
    if (studentId) query = query.eq("student_id", studentId);
  } else if (studentId) {
    query = query.eq("student_id", studentId);
  }

  if (assessmentId) query = query.eq("assessment_id", assessmentId);
  if (questionId) query = query.eq("question_id", questionId);

  query = query.order("created_at", { ascending: false }).limit(100);

  const { data, error } = await query;
  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, (data ?? []).map(mapSubmission));
});

// ── GET /submissions/:id ──────────────────────────────────────────────
submissions.get("/:id", async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");

  const db = user.role === "student"
    ? createSupabaseClient(c.get("token") as string)
    : getSupabaseAdmin();
  const { data, error } = await db
    .from("submissions")
    .select(`
      *,
      profiles!submissions_student_id_fkey(name),
      questions!submissions_question_id_fkey(title, test_cases)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return sendError(c, 404, "Submission not found");

  // Students can only see their own
  if (user.role === "student" && data.student_id !== user.id) {
    return sendError(c, 403, "Access denied");
  }

  return sendSuccess(c, mapSubmission(data));
});

// ── POST /submissions/:attemptId/complete ─────────────────────────────
submissions.post("/:attemptId/complete", requireRole("student"), async (c) => {
  const user = c.get("user") as AuthUser;
  const attemptId = c.req.param("attemptId");

  // Per-user client for student-scoped writes
  const userDb = createSupabaseClient(c.get("token") as string);
  const { data, error } = await userDb
    .from("assessment_attempts")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", attemptId)
    .eq("student_id", user.id)
    .eq("status", "in-progress")
    .select()
    .single();

  if (error || !data) return sendError(c, 400, "Attempt not found or already completed");

  return sendSuccess(c, { message: "Attempt completed", score: data.score, maxScore: data.max_score });
});

function mapSubmission(row: any) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.profiles?.name ?? "",
    assessmentId: row.assessment_id,
    questionId: row.question_id,
    questionTitle: row.questions?.title ?? "",
    attemptId: row.attempt_id,
    code: row.code,
    language: row.language,
    score: row.score,
    maxScore: row.max_score,
    testsPassed: row.tests_passed,
    testsTotal: row.tests_total,
    testResults: row.test_results ?? [],
    status: row.status,
    createdAt: row.created_at,
  };
}

export default submissions;
