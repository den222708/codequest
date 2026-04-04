import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseAdmin, createSupabaseClient } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { cacheGet, cacheSet, cacheFlushPattern } from "../lib/cache.js";
import { createChildLogger } from "../lib/logger.js";
import type { AuthUser } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";

const log = createChildLogger({ module: "questions" });

const questions = new Hono<AppEnv>();
questions.use("*", authMiddleware);

const questionBaseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionType: z.enum(["coding", "mcq", "short_answer", "true_false"]).default("coding"),
  topic: z.string().min(1),
  tags: z.array(z.string()).default([]),
  points: z.number().int().min(1).default(10),
  timeLimit: z.number().int().min(1).default(30),
  memoryLimit: z.number().int().min(1).default(256),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().default(false),
        points: z.number().int().min(0).default(0),
        timeLimit: z.number().int().min(100).default(2000),
      })
    )
    .default([]),
  boilerplateCode: z
    .object({
      python: z.string().optional(),
      javascript: z.string().optional(),
      java: z.string().optional(),
      cpp: z.string().optional(),
    })
    .default({}),
  solution: z.string().optional(),
  hints: z.array(z.string()).default([]),
  options: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(1),
        isCorrect: z.boolean(),
      })
    )
    .nullable()
    .default(null),
  correctAnswer: z.string().nullable().default(null),
  isVisible: z.boolean().default(true),
});

const questionSchema = questionBaseSchema.refine((data) => {
  if (data.questionType === "coding" && data.testCases.length < 1) return false;
  if (data.questionType === "mcq") {
    if (!data.options || data.options.length < 2) return false;
    if (data.options.filter(o => o.isCorrect).length !== 1) return false;
  }
  if (data.questionType === "true_false") {
    if (data.correctAnswer !== "true" && data.correctAnswer !== "false") return false;
  }
  if (data.questionType === "short_answer") {
    if (!data.correctAnswer || data.correctAnswer.trim().length === 0) return false;
  }
  return true;
}, {
  message: "Invalid question data for the selected question type",
});

// ── GET /questions ────────────────────────────────────────────────────
questions.get("/", async (c) => {
  const user = c.get("user") as AuthUser;
  const difficulty = c.req.query("difficulty");
  const topic = c.req.query("topic");
  const search = c.req.query("search");

  const cacheKey = `questions:list:${user.role}:${difficulty ?? ""}:${topic ?? ""}:${search ?? ""}`;
  const cached = cacheGet(cacheKey);
  if (cached) return sendSuccess(c, cached);

  // Students use per-user client for RLS; teachers/admins use admin client
  const supabase = user.role === "student"
    ? createSupabaseClient(c.get("token") as string)
    : getSupabaseAdmin();
  let query = supabase.from("questions").select("*");

  // Students only see visible questions
  if (user.role === "student") {
    query = query.eq("is_visible", true);
  }

  if (difficulty) query = query.eq("difficulty", difficulty);
  if (topic) query = query.eq("topic", topic);
  if (search) {
    const safe = search.replace(/[%_(),.*\\]/g, "");
    if (safe) {
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    log.error({ err: error }, "Failed to fetch questions");
    return sendError(c, 500, "Failed to fetch questions");
  }

  const mapped = (data ?? []).map(mapQuestion);
  cacheSet(cacheKey, mapped, 120);
  return sendSuccess(c, mapped);
});

// ── GET /questions/:id ────────────────────────────────────────────────
questions.get("/:id", async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");

  const cacheKey = `questions:${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return sendSuccess(c, cached);

  const supabase = user.role === "student"
    ? createSupabaseClient(c.get("token") as string)
    : getSupabaseAdmin();
  const { data, error } = await supabase.from("questions").select("*").eq("id", id).single();

  if (error || !data) return sendError(c, 404, "Question not found");
  if (user.role === "student" && !data.is_visible) return sendError(c, 404, "Question not found");

  const mapped = mapQuestion(data);

  // Hide solution and hidden test details from students
  if (user.role === "student") {
    mapped.solution = undefined;
    mapped.testCases = mapped.testCases.map((tc: any) =>
      tc.isHidden ? { ...tc, expectedOutput: "[hidden]", input: "[hidden]" } : tc
    );
  }

  cacheSet(cacheKey, mapped, 300);
  return sendSuccess(c, mapped);
});

// ── POST /questions ───────────────────────────────────────────────────
questions.post("/", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const body = await c.req.json().catch(() => null);
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      difficulty: parsed.data.difficulty,
      question_type: parsed.data.questionType,
      topic: parsed.data.topic,
      tags: parsed.data.tags,
      points: parsed.data.points,
      time_limit: parsed.data.timeLimit,
      memory_limit: parsed.data.memoryLimit,
      test_cases: parsed.data.testCases,
      boilerplate_code: parsed.data.boilerplateCode,
      solution: parsed.data.solution ?? null,
      hints: parsed.data.hints,
      options: parsed.data.options,
      correct_answer: parsed.data.correctAnswer,
      is_visible: parsed.data.isVisible,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    log.error({ err: error }, "Failed to create question");
    return sendError(c, 500, "Failed to create question");
  }

  cacheFlushPattern("questions:");
  return sendSuccess(c, mapQuestion(data), 201);
});

// ── PUT /questions/:id ────────────────────────────────────────────────
questions.put("/:id", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = questionBaseSchema.partial().safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const supabase = getSupabaseAdmin();

  // Teachers can only update their own questions
  if (user.role === "teacher") {
    const { data: existing } = await supabase.from("questions").select("created_by").eq("id", id).single();
    if (!existing) return sendError(c, 404, "Question not found");
    if (existing.created_by !== user.id) return sendError(c, 403, "Can only modify your own questions");
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const d = parsed.data;

  if (d.title) updates.title = d.title;
  if (d.description) updates.description = d.description;
  if (d.difficulty) updates.difficulty = d.difficulty;
  if (d.questionType) updates.question_type = d.questionType;
  if (d.topic) updates.topic = d.topic;
  if (d.tags) updates.tags = d.tags;
  if (d.points !== undefined) updates.points = d.points;
  if (d.timeLimit !== undefined) updates.time_limit = d.timeLimit;
  if (d.memoryLimit !== undefined) updates.memory_limit = d.memoryLimit;
  if (d.testCases) updates.test_cases = d.testCases;
  if (d.boilerplateCode) updates.boilerplate_code = d.boilerplateCode;
  if (d.solution !== undefined) updates.solution = d.solution;
  if (d.hints) updates.hints = d.hints;
  if (d.options !== undefined) updates.options = d.options;
  if (d.correctAnswer !== undefined) updates.correct_answer = d.correctAnswer;
  if (d.isVisible !== undefined) updates.is_visible = d.isVisible;

  const { data, error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    log.error({ err: error, questionId: id }, "Failed to update question");
    return sendError(c, 500, "Failed to update question");
  }

  cacheFlushPattern("questions:");
  return sendSuccess(c, mapQuestion(data));
});

// ── DELETE /questions/:id ─────────────────────────────────────────────
questions.delete("/:id", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  // Teachers can only delete their own questions
  if (user.role === "teacher") {
    const { data: existing } = await supabase.from("questions").select("created_by").eq("id", id).single();
    if (!existing) return sendError(c, 404, "Question not found");
    if (existing.created_by !== user.id) return sendError(c, 403, "Can only delete your own questions");
  }

  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) {
    log.error({ err: error, questionId: id }, "Failed to delete question");
    return sendError(c, 500, "Failed to delete question");
  }

  cacheFlushPattern("questions:");
  return sendSuccess(c, { message: "Question deleted" });
});

// ── PATCH /questions/:id/visibility ───────────────────────────────────
questions.patch("/:id/visibility", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const isVisible = body?.isVisible;
  if (typeof isVisible !== "boolean") return sendError(c, 400, "isVisible (boolean) is required");

  const supabase = getSupabaseAdmin();

  // Teachers can only toggle visibility on their own questions
  if (user.role === "teacher") {
    const { data: existing } = await supabase.from("questions").select("created_by").eq("id", id).single();
    if (!existing) return sendError(c, 404, "Question not found");
    if (existing.created_by !== user.id) return sendError(c, 403, "Can only modify your own questions");
  }

  const { data, error } = await supabase
    .from("questions")
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return sendError(c, 500, "Failed to update question visibility");

  cacheFlushPattern("questions:");
  return sendSuccess(c, mapQuestion(data));
});

function mapQuestion(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    questionType: row.question_type ?? "coding",
    topic: row.topic,
    tags: row.tags ?? [],
    points: row.points,
    timeLimit: row.time_limit,
    memoryLimit: row.memory_limit,
    testCases: row.test_cases ?? [],
    boilerplateCode: row.boilerplate_code ?? {},
    solution: row.solution,
    hints: row.hints ?? [],
    options: row.options ?? null,
    correctAnswer: row.correct_answer ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isVisible: row.is_visible,
    usageCount: row.usage_count ?? 0,
  };
}

export default questions;
