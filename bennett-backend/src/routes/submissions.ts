import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseAdmin } from "../lib/supabase.js";
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
  const supabase = getSupabaseAdmin();

  // Verify attempt belongs to user and is in-progress
  const { data: attempt } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("student_id", user.id)
    .eq("status", "in-progress")
    .single();

  if (!attempt) return sendError(c, 400, "Invalid or expired attempt");

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

  const supabase = getSupabaseAdmin();
  let query = supabase.from("submissions").select(`
    *,
    profiles!submissions_student_id_fkey(name),
    questions!submissions_question_id_fkey(title)
  `);

  // Students can only see their own
  if (user.role === "student") {
    query = query.eq("student_id", user.id);
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

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
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

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
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
