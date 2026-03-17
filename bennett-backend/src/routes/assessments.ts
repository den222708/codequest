import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseAdmin, createSupabaseClient } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { cacheGet, cacheSet, cacheFlushPattern } from "../lib/cache.js";
import { notifyAssessmentPublished } from "../services/notificationService.js";
import type { AuthUser } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";

const assessments = new Hono<AppEnv>();
assessments.use("*", authMiddleware);

const settingsSchema = z.object({
  randomizeQuestions: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(false),
  showScoreImmediately: z.boolean().default(true),
  allowRetakes: z.boolean().default(false),
  maxAttempts: z.number().int().min(1).default(1),
  ipRestriction: z.boolean().default(false),
  allowedIPs: z.array(z.string()).default([]),
  plagiarismSensitivity: z.enum(["low", "medium", "high"]).default("medium"),
  proctoring: z.boolean().default(false),
});

const assessmentBaseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(5),
  type: z.enum(["quiz", "exam", "assignment", "practice"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.number().int().min(1),
  passingScore: z.number().min(0).max(100).default(60),
  totalPoints: z.number().int().min(1),
  questionIds: z.array(z.string().uuid()).min(1),
  startDate: z.string(),
  endDate: z.string(),
  settings: settingsSchema.default({}),
  courseCode: z.string().optional(),
  courseName: z.string().optional(),
  monitoringMode: z.enum(["standard", "proctored"]).optional(),
});

const assessmentSchema = assessmentBaseSchema.refine(
  (data) => !data.startDate || !data.endDate || new Date(data.startDate) < new Date(data.endDate),
  { message: "startDate must be before endDate", path: ["endDate"] }
);

// ── GET /assessments ──────────────────────────────────────────────────
assessments.get("/", async (c) => {
  const user = c.get("user") as AuthUser;
  const status = c.req.query("status");
  const type = c.req.query("type");

  const cacheKey = `assessments:list:${user.role}:${user.id}:${status ?? ""}:${type ?? ""}`;
  const cached = cacheGet(cacheKey);
  if (cached) return sendSuccess(c, cached);

  const supabase = getSupabaseAdmin();

  // Students use per-user client for RLS-scoped enrollment/assignment reads
  if (user.role === "student") {
    const userDb = createSupabaseClient(c.get("token") as string);
    // Get class IDs the student is enrolled in
    const { data: enrollments, error: enrollErr } = await userDb
      .from("class_enrollments")
      .select("class_id")
      .eq("student_id", user.id);
    if (enrollErr) return sendError(c, 500, enrollErr.message);

    const classIds = (enrollments ?? []).map((e) => e.class_id);

    // Get assessment IDs assigned to those classes
    let assignedIds: string[] = [];
    if (classIds.length > 0) {
      const { data: assignments, error: assignErr } = await userDb
        .from("assessment_assignments")
        .select("assessment_id")
        .in("class_id", classIds);
      if (assignErr) return sendError(c, 500, assignErr.message);
      assignedIds = (assignments ?? []).map((a) => a.assessment_id);
    }

    // Also include demo assessments (course_code = 'DEMO-101')
    const { data: demoAssessments, error: demoErr } = await supabase
      .from("assessments")
      .select("id")
      .eq("course_code", "DEMO-101");
    if (demoErr) return sendError(c, 500, demoErr.message);
    const demoIds = (demoAssessments ?? []).map((d) => d.id);

    const visibleIds = [...new Set([...assignedIds, ...demoIds])];

    if (visibleIds.length === 0) return sendSuccess(c, []);

    let query = supabase
      .from("assessments")
      .select(`
        *,
        assessment_questions(question_id, order, points),
        profiles!assessments_created_by_fkey(name)
      `)
      .in("id", visibleIds)
      .in("status", ["published", "active", "completed"]);

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) return sendError(c, 500, error.message);

    const mapped = (data ?? []).map(mapAssessment);
    cacheSet(cacheKey, mapped, 120);
    return sendSuccess(c, mapped);
  }

  // Admin/Teacher: see all (teacher may want to see their own; admin sees everything)
  let query = supabase.from("assessments").select(`
    *,
    assessment_questions(question_id, order, points),
    profiles!assessments_created_by_fkey(name)
  `);

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("type", type);

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return sendError(c, 500, error.message);

  const mapped = (data ?? []).map(mapAssessment);
  cacheSet(cacheKey, mapped, 120);
  return sendSuccess(c, mapped);
});

// ── GET /assessments/:id ──────────────────────────────────────────────
assessments.get("/:id", async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");

  const cacheKey = `assessments:${id}`;
  const cached = cacheGet(cacheKey);
  if (cached) return sendSuccess(c, cached);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("assessments")
    .select(`
      *,
      assessment_questions(question_id, order, points, questions(*)),
      profiles!assessments_created_by_fkey(name)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return sendError(c, 404, "Assessment not found");
  if (user.role === "student" && data.status === "draft") {
    return sendError(c, 404, "Assessment not found");
  }

  // Students can only view assessments assigned to their class or demo assessments
  if (user.role === "student") {
    const isDemo = data.course_code === "DEMO-101";
    if (!isDemo) {
      const userDb = createSupabaseClient(c.get("token") as string);
      const { data: enrollments } = await userDb
        .from("class_enrollments")
        .select("class_id")
        .eq("student_id", user.id);
      const classIds = (enrollments ?? []).map((e) => e.class_id);
      let hasAccess = false;
      if (classIds.length > 0) {
        const { data: assignment } = await userDb
          .from("assessment_assignments")
          .select("id")
          .eq("assessment_id", id)
          .in("class_id", classIds)
          .limit(1)
          .maybeSingle();
        hasAccess = !!assignment;
      }
      if (!hasAccess) {
        return sendError(c, 403, "This assessment is not assigned to your class");
      }
    }
  }

  const mapped = mapAssessment(data);
  cacheSet(cacheKey, mapped, 300);
  return sendSuccess(c, mapped);
});

// ── POST /assessments ─────────────────────────────────────────────────
assessments.post("/", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const body = await c.req.json().catch(() => null);
  const parsed = assessmentSchema.safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const supabase = getSupabaseAdmin();
  const d = parsed.data;

  const { data: assessment, error } = await supabase
    .from("assessments")
    .insert({
      title: d.title,
      description: d.description,
      type: d.type,
      difficulty: d.difficulty,
      duration: d.duration,
      passing_score: d.passingScore,
      total_points: d.totalPoints,
      start_date: d.startDate,
      end_date: d.endDate,
      settings: d.settings,
      status: "draft",
      created_by: user.id,
      course_code: d.courseCode ?? null,
      course_name: d.courseName ?? null,
      ...(d.monitoringMode ? { monitoring_mode: d.monitoringMode } : {}),
    })
    .select()
    .single();

  if (error) return sendError(c, 500, error.message);

  // Link questions
  const questionLinks = d.questionIds.map((qId, idx) => ({
    assessment_id: assessment.id,
    question_id: qId,
    order: idx + 1,
    points: 0,
  }));

  const { error: linkErr } = await supabase.from("assessment_questions").insert(questionLinks);
  if (linkErr) {
    // Rollback: delete the created assessment
    await supabase.from("assessments").delete().eq("id", assessment.id);
    return sendError(c, 500, "Failed to link questions to assessment");
  }

  cacheFlushPattern("assessments:");
  return sendSuccess(c, mapAssessment(assessment), 201);
});

// ── PUT /assessments/:id ──────────────────────────────────────────────
assessments.put("/:id", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = assessmentBaseSchema.partial().safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const supabase = getSupabaseAdmin();

  // Teachers can only update their own assessments
  if (user.role === "teacher") {
    const { data: existing } = await supabase.from("assessments").select("created_by").eq("id", id).single();
    if (!existing) return sendError(c, 404, "Assessment not found");
    if (existing.created_by !== user.id) return sendError(c, 403, "Can only modify your own assessments");
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const d = parsed.data;

  if (d.title) updates.title = d.title;
  if (d.description) updates.description = d.description;
  if (d.type) updates.type = d.type;
  if (d.difficulty) updates.difficulty = d.difficulty;
  if (d.duration !== undefined) updates.duration = d.duration;
  if (d.passingScore !== undefined) updates.passing_score = d.passingScore;
  if (d.totalPoints !== undefined) updates.total_points = d.totalPoints;
  if (d.startDate) updates.start_date = d.startDate;
  if (d.endDate) updates.end_date = d.endDate;
  if (d.settings) updates.settings = d.settings;
  if (d.courseCode !== undefined) updates.course_code = d.courseCode;
  if (d.courseName !== undefined) updates.course_name = d.courseName;
  if (d.monitoringMode !== undefined) updates.monitoring_mode = d.monitoringMode;

  // Also accept status changes
  const statusVal = body?.status;
  if (statusVal && ["draft", "published", "active", "completed"].includes(statusVal)) {
    updates.status = statusVal;
  }

  // Detect publish transition atomically using .neq("status","published")
  // so only one concurrent request can win the transition and fire the notification.
  let wasPublished = false;
  let data: any;

  if (statusVal === "published") {
    // Attempt atomic publish: only updates rows not already published
    const { data: transitioned, error: pubErr } = await supabase
      .from("assessments")
      .update(updates)
      .eq("id", id)
      .neq("status", "published")
      .select()
      .maybeSingle();

    if (pubErr) return sendError(c, 500, pubErr.message);

    if (transitioned) {
      wasPublished = true;
      data = transitioned;
    } else {
      // Already published by another request. Apply non-status updates if any.
      const { status: _s, ...nonStatusUpdates } = updates;
      if (Object.keys(nonStatusUpdates).length > 0) {
        const { data: d2, error: e2 } = await supabase
          .from("assessments").update(nonStatusUpdates).eq("id", id).select().single();
        if (e2) return sendError(c, 500, e2.message);
        data = d2;
      } else {
        const { data: d2, error: e2 } = await supabase
          .from("assessments").select().eq("id", id).single();
        if (e2) return sendError(c, 500, e2.message);
        data = d2;
      }
    }
  } else {
    const { data: d2, error } = await supabase
      .from("assessments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return sendError(c, 500, error.message);
    data = d2;
  }

  // Update question links if provided
  if (d.questionIds && d.questionIds.length > 0) {
    await supabase.from("assessment_questions").delete().eq("assessment_id", id);
    const questionLinks = d.questionIds.map((qId, idx) => ({
      assessment_id: id,
      question_id: qId,
      order: idx + 1,
      points: 0,
    }));
    await supabase.from("assessment_questions").insert(questionLinks);
  }

  // If newly published, notify students in assigned classes
  if (wasPublished) {
    const { data: assignments } = await supabase
      .from("assessment_assignments")
      .select("class_id")
      .eq("assessment_id", id);
    const classIds = (assignments ?? []).map((a: any) => a.class_id);
    // Fire-and-forget — does not block response
    notifyAssessmentPublished(id!, String((data as any).title ?? "Assessment"), classIds as string[]);
  }

  cacheFlushPattern("assessments:");
  return sendSuccess(c, mapAssessment(data));
});

// ── DELETE /assessments/:id ───────────────────────────────────────────
assessments.delete("/:id", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  // Teachers can only delete their own assessments
  if (user.role === "teacher") {
    const { data: existing } = await supabase.from("assessments").select("created_by").eq("id", id).single();
    if (!existing) return sendError(c, 404, "Assessment not found");
    if (existing.created_by !== user.id) return sendError(c, 403, "Can only delete your own assessments");
  }

  await supabase.from("assessment_questions").delete().eq("assessment_id", id);
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  if (error) return sendError(c, 500, error.message);

  cacheFlushPattern("assessments:");
  return sendSuccess(c, { message: "Assessment deleted" });
});

// ── POST /assessments/:id/clone ───────────────────────────────────────
assessments.post("/:id/clone", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  const { data: original, error } = await supabase
    .from("assessments")
    .select("*, assessment_questions(question_id, order, points)")
    .eq("id", id)
    .single();

  if (error || !original) return sendError(c, 404, "Assessment not found");

  const { data: clone, error: cloneErr } = await supabase
    .from("assessments")
    .insert({
      title: `${original.title} (Copy)`,
      description: original.description,
      type: original.type,
      difficulty: original.difficulty,
      duration: original.duration,
      passing_score: original.passing_score,
      total_points: original.total_points,
      start_date: original.start_date,
      end_date: original.end_date,
      settings: original.settings,
      status: "draft",
      created_by: user.id,
      course_code: original.course_code,
      course_name: original.course_name,
    })
    .select()
    .single();

  if (cloneErr) return sendError(c, 500, cloneErr.message);

  // Clone question links
  if (original.assessment_questions?.length) {
    const links = original.assessment_questions.map((aq: any) => ({
      assessment_id: clone.id,
      question_id: aq.question_id,
      order: aq.order,
      points: aq.points,
    }));
    await supabase.from("assessment_questions").insert(links);
  }

  cacheFlushPattern("assessments:");
  return sendSuccess(c, mapAssessment(clone), 201);
});

// ── POST /assessments/:id/attempts ────────────────────────────────────
assessments.post("/:id/attempts", requireRole("student"), async (c) => {
  const user = c.get("user") as AuthUser;
  const assessmentId = c.req.param("id");
  const token = c.get("token") as string;
  const userDb = createSupabaseClient(token);
  const supabase = getSupabaseAdmin();

  // Check assessment exists and is active
  const { data: assessment, error: assessmentErr } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();

  if (assessmentErr || !assessment) return sendError(c, 404, "Assessment not found");
  if (!["published", "active"].includes(assessment.status)) {
    return sendError(c, 400, "Assessment is not available");
  }

  // Verify student has access: enrolled in a class with this assessment, or demo
  // Per-user client for RLS-scoped enrollment reads
  const isDemo = assessment.course_code === "DEMO-101";
  if (!isDemo) {
    const { data: enrollments, error: enrollErr } = await userDb
      .from("class_enrollments")
      .select("class_id")
      .eq("student_id", user.id);
    if (enrollErr) return sendError(c, 500, enrollErr.message);
    const classIds = (enrollments ?? []).map((e) => e.class_id);

    if (classIds.length === 0) {
      return sendError(c, 403, "You are not enrolled in any class");
    }

    const { data: assignment, error: assignErr } = await userDb
      .from("assessment_assignments")
      .select("id")
      .eq("assessment_id", assessmentId)
      .in("class_id", classIds)
      .limit(1)
      .maybeSingle();
    if (assignErr) return sendError(c, 500, assignErr.message);

    if (!assignment) {
      return sendError(c, 403, "This assessment is not assigned to your class");
    }
  }

  // Check max attempts (per-user client)
  const { count, error: countErr } = await userDb
    .from("assessment_attempts")
    .select("*", { count: "exact", head: true })
    .eq("assessment_id", assessmentId)
    .eq("student_id", user.id);
  if (countErr) return sendError(c, 500, countErr.message);

  const maxAttempts = assessment.settings?.maxAttempts ?? 1;
  if ((count ?? 0) >= maxAttempts) {
    return sendError(c, 400, "Maximum attempts reached");
  }

  const { data: attempt, error } = await userDb
    .from("assessment_attempts")
    .insert({
      assessment_id: assessmentId,
      student_id: user.id,
      status: "in-progress",
      score: 0,
      max_score: assessment.total_points,
      time_spent: 0,
    })
    .select()
    .single();

  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, {
    id: attempt.id,
    assessmentId: attempt.assessment_id,
    studentId: attempt.student_id,
    startedAt: attempt.started_at,
    status: attempt.status,
    score: attempt.score,
    maxScore: attempt.max_score,
  }, 201);
});

function mapAssessment(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    difficulty: row.difficulty,
    duration: row.duration,
    passingScore: row.passing_score,
    totalPoints: row.total_points,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    settings: row.settings ?? {},
    createdBy: row.created_by,
    createdAt: row.created_at,
    courseCode: row.course_code,
    courseName: row.course_name,
    monitoringMode: row.monitoring_mode ?? "standard",
    professorName: row.profiles?.name ?? "",
    questions: row.assessment_questions?.map((aq: any) => ({
      ...(aq.questions ? mapAqQuestion(aq.questions) : {}),
      order: aq.order,
      points: aq.points,
      questionId: aq.question_id,
    })) ?? [],
  };
}

function mapAqQuestion(q: any) {
  return {
    id: q.id,
    title: q.title,
    description: q.description,
    difficulty: q.difficulty,
    topic: q.topic,
    tags: q.tags ?? [],
    points: q.points,
    timeLimit: q.time_limit,
    testCases: q.test_cases ?? [],
    boilerplateCode: q.boilerplate_code ?? {},
  };
}

export default assessments;
