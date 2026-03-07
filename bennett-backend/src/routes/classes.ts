import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { cacheFlushPattern } from "../lib/cache.js";
import type { AuthUser } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";

const classes = new Hono<AppEnv>();
classes.use("*", authMiddleware);

const classSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(50),
  description: z.string().max(1000).optional(),
  department: z.string().max(100).optional(),
  schedule: z.string().max(500).optional(),
  teacherId: z.string().uuid(),
});

// ── GET /classes ──────────────────────────────────────────────────────
classes.get("/", async (c) => {
  const user = c.get("user") as AuthUser;
  const supabase = getSupabaseAdmin();

  let query = supabase.from("classes").select(`
    *,
    profiles!classes_teacher_id_fkey(name, email),
    class_enrollments(id)
  `);

  if (user.role === "teacher") {
    query = query.eq("teacher_id", user.id);
  } else if (user.role === "student") {
    // Students see only classes they're enrolled in
    const { data: enrollments } = await supabase
      .from("class_enrollments")
      .select("class_id")
      .eq("student_id", user.id);
    const classIds = (enrollments ?? []).map((e) => e.class_id);
    if (classIds.length === 0) return sendSuccess(c, []);
    query = query.in("id", classIds);
  }
  // Admin sees all (no filter)

  query = query.order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, (data ?? []).map(mapClass));
});

// ── GET /classes/:id ──────────────────────────────────────────────────
classes.get("/:id", async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("classes")
    .select(`
      *,
      profiles!classes_teacher_id_fkey(name, email),
      class_enrollments(student_id, enrolled_at, profiles!class_enrollments_student_id_fkey(name, email, enrollment_id, department))
    `)
    .eq("id", id)
    .single();

  if (error || !data) return sendError(c, 404, "Class not found");

  // Access control
  if (user.role === "teacher" && data.teacher_id !== user.id) {
    return sendError(c, 403, "Not your class");
  }
  if (user.role === "student") {
    const enrolled = (data.class_enrollments ?? []).some(
      (e: any) => e.student_id === user.id
    );
    if (!enrolled) return sendError(c, 403, "Not enrolled in this class");
  }

  return sendSuccess(c, mapClassDetail(data));
});

// ── POST /classes ─────────────────────────────────────────────────────
classes.post("/", requireRole("admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const body = await c.req.json().catch(() => null);
  const parsed = classSchema.safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const supabase = getSupabaseAdmin();
  const d = parsed.data;

  // Verify teacher exists and has role teacher
  const { data: teacher } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", d.teacherId)
    .single();

  if (!teacher) return sendError(c, 400, "Teacher not found");
  if (teacher.role !== "teacher") return sendError(c, 400, "User is not a teacher");

  const { data, error } = await supabase
    .from("classes")
    .insert({
      name: d.name,
      code: d.code,
      description: d.description ?? null,
      department: d.department ?? null,
      schedule: d.schedule ?? null,
      teacher_id: d.teacherId,
      created_by: user.id,
    })
    .select(`*, profiles!classes_teacher_id_fkey(name, email)`)
    .single();

  if (error) {
    if (error.code === "23505") return sendError(c, 409, "Class code already exists");
    return sendError(c, 500, error.message);
  }

  return sendSuccess(c, mapClass(data), 201);
});

// ── PUT /classes/:id ──────────────────────────────────────────────────
classes.put("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = classSchema.partial().safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const supabase = getSupabaseAdmin();
  const updates: Record<string, unknown> = {};
  const d = parsed.data;

  if (d.name) updates.name = d.name;
  if (d.code) updates.code = d.code;
  if (d.description !== undefined) updates.description = d.description;
  if (d.department !== undefined) updates.department = d.department;
  if (d.schedule !== undefined) updates.schedule = d.schedule;
  if (d.teacherId) {
    // Verify new teacher
    const { data: teacher } = await supabase
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", d.teacherId)
      .single();
    if (!teacher || teacher.role !== "teacher") return sendError(c, 400, "Invalid teacher");
    updates.teacher_id = d.teacherId;
  }

  // Accept status changes
  const statusVal = body?.status;
  if (statusVal && ["active", "archived"].includes(statusVal)) {
    updates.status = statusVal;
  }

  const { data, error } = await supabase
    .from("classes")
    .update(updates)
    .eq("id", id)
    .select(`*, profiles!classes_teacher_id_fkey(name, email)`)
    .single();

  if (error) {
    if (error.code === "23505") return sendError(c, 409, "Class code already exists");
    return sendError(c, 500, error.message);
  }

  return sendSuccess(c, mapClass(data));
});

// ── DELETE /classes/:id ───────────────────────────────────────────────
classes.delete("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from("classes").delete().eq("id", id).select("id").maybeSingle();
  if (error) return sendError(c, 500, error.message);
  if (!data) return sendError(c, 404, "Class not found");

  return sendSuccess(c, { message: "Class deleted" });
});

// ── GET /classes/:id/students ─────────────────────────────────────────
classes.get("/:id/students", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  // Teachers can only see their own class students
  if (user.role === "teacher") {
    const { data: cls } = await supabase.from("classes").select("teacher_id").eq("id", id).single();
    if (!cls) return sendError(c, 404, "Class not found");
    if (cls.teacher_id !== user.id) return sendError(c, 403, "Not your class");
  }

  const { data, error } = await supabase
    .from("class_enrollments")
    .select(`
      id,
      enrolled_at,
      student_id,
      profiles!class_enrollments_student_id_fkey(user_id, name, email, enrollment_id, department, avatar_url, status)
    `)
    .eq("class_id", id)
    .order("enrolled_at", { ascending: true });

  if (error) return sendError(c, 500, error.message);

  const students = (data ?? []).map((row: any) => ({
    enrollmentRecordId: row.id,
    enrolledAt: row.enrolled_at,
    id: row.profiles?.user_id ?? row.student_id,
    name: row.profiles?.name ?? "",
    email: row.profiles?.email ?? "",
    enrollmentId: row.profiles?.enrollment_id ?? "",
    department: row.profiles?.department ?? "",
    avatar: row.profiles?.avatar_url ?? "",
    status: row.profiles?.status ?? "active",
  }));

  return sendSuccess(c, students);
});

// ── POST /classes/:id/enroll ──────────────────────────────────────────
const enrollSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1).max(500),
});

classes.post("/:id/enroll", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = enrollSchema.safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const supabase = getSupabaseAdmin();

  // Verify class exists
  const { data: cls } = await supabase.from("classes").select("id").eq("id", id).single();
  if (!cls) return sendError(c, 404, "Class not found");

  // Verify all students exist and have role student
  const { data: students } = await supabase
    .from("profiles")
    .select("user_id, role")
    .in("user_id", parsed.data.studentIds);

  const validStudentIds = (students ?? [])
    .filter((s) => s.role === "student")
    .map((s) => s.user_id);

  const invalidIds = parsed.data.studentIds.filter((sid) => !validStudentIds.includes(sid));

  if (validStudentIds.length === 0) {
    return sendError(c, 400, "No valid students found");
  }

  // Insert enrollments (skip duplicates)
  const rows = validStudentIds.map((sid) => ({
    class_id: id,
    student_id: sid,
  }));

  const { data: inserted, error } = await supabase
    .from("class_enrollments")
    .upsert(rows, { onConflict: "class_id,student_id", ignoreDuplicates: true })
    .select();

  if (error) return sendError(c, 500, error.message);

  const actuallyEnrolled = inserted?.length ?? 0;
  return sendSuccess(c, {
    enrolled: actuallyEnrolled,
    skippedInvalid: invalidIds,
    skippedDuplicates: validStudentIds.length - actuallyEnrolled,
    message: `${actuallyEnrolled} newly enrolled, ${validStudentIds.length - actuallyEnrolled} already enrolled`,
  }, 201);
});

// ── DELETE /classes/:id/enroll/:studentId ──────────────────────────────
classes.delete("/:id/enroll/:studentId", requireRole("admin"), async (c) => {
  const classId = c.req.param("id");
  const studentId = c.req.param("studentId");
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("class_enrollments")
    .delete()
    .eq("class_id", classId)
    .eq("student_id", studentId);

  if (error) return sendError(c, 500, error.message);
  return sendSuccess(c, { message: "Student unenrolled" });
});

// ── POST /classes/:id/assessments ─────────────────────────────────────
const assignSchema = z.object({
  assessmentId: z.string().uuid(),
});

classes.post("/:id/assessments", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const classId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const supabase = getSupabaseAdmin();

  // Verify class exists and caller has access
  const { data: cls } = await supabase.from("classes").select("id, teacher_id").eq("id", classId).single();
  if (!cls) return sendError(c, 404, "Class not found");
  if (user.role === "teacher" && cls.teacher_id !== user.id) {
    return sendError(c, 403, "Not your class");
  }

  // Verify assessment exists
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, created_by")
    .eq("id", parsed.data.assessmentId)
    .single();

  if (!assessment) return sendError(c, 404, "Assessment not found");

  // Teachers can only assign their own assessments
  if (user.role === "teacher" && assessment.created_by !== user.id) {
    return sendError(c, 403, "Can only assign your own assessments");
  }

  const { error } = await supabase
    .from("assessment_assignments")
    .insert({
      assessment_id: parsed.data.assessmentId,
      class_id: classId,
      assigned_by: user.id,
    });

  if (error) {
    if (error.code === "23505") return sendError(c, 409, "Assessment already assigned to this class");
    return sendError(c, 500, error.message);
  }

  cacheFlushPattern("assessments:");
  return sendSuccess(c, { message: "Assessment assigned to class" }, 201);
});

// ── DELETE /classes/:id/assessments/:assessmentId ─────────────────────
classes.delete("/:id/assessments/:assessmentId", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const classId = c.req.param("id");
  const assessmentId = c.req.param("assessmentId");
  const supabase = getSupabaseAdmin();

  // Verify class access
  if (user.role === "teacher") {
    const { data: cls } = await supabase.from("classes").select("teacher_id").eq("id", classId).single();
    if (!cls) return sendError(c, 404, "Class not found");
    if (cls.teacher_id !== user.id) return sendError(c, 403, "Not your class");
  }

  const { error } = await supabase
    .from("assessment_assignments")
    .delete()
    .eq("assessment_id", assessmentId)
    .eq("class_id", classId);

  if (error) return sendError(c, 500, error.message);
  cacheFlushPattern("assessments:");
  return sendSuccess(c, { message: "Assessment unassigned from class" });
});

// ── GET /classes/:id/assessments ──────────────────────────────────────
classes.get("/:id/assessments", async (c) => {
  const user = c.get("user") as AuthUser;
  const classId = c.req.param("id");
  const supabase = getSupabaseAdmin();

  // Access control
  if (user.role === "teacher") {
    const { data: cls } = await supabase.from("classes").select("teacher_id").eq("id", classId).single();
    if (!cls) return sendError(c, 404, "Class not found");
    if (cls.teacher_id !== user.id) return sendError(c, 403, "Not your class");
  } else if (user.role === "student") {
    const { data: enrollment } = await supabase
      .from("class_enrollments")
      .select("id")
      .eq("class_id", classId)
      .eq("student_id", user.id)
      .maybeSingle();
    if (!enrollment) return sendError(c, 403, "Not enrolled in this class");
  }

  const { data: assignments, error } = await supabase
    .from("assessment_assignments")
    .select(`
      id,
      assigned_at,
      assessments(
        id, title, description, type, difficulty, duration,
        passing_score, total_points, start_date, end_date,
        status, settings, course_code, course_name, created_by,
        created_at,
        profiles!assessments_created_by_fkey(name)
      )
    `)
    .eq("class_id", classId)
    .order("assigned_at", { ascending: false });

  if (error) return sendError(c, 500, error.message);

  const assessments = (assignments ?? [])
    .filter((a: any) => a.assessments)
    .map((a: any) => {
      const r = a.assessments;
      return {
        assignmentId: a.id,
        assignedAt: a.assigned_at,
        id: r.id,
        title: r.title,
        description: r.description,
        type: r.type,
        difficulty: r.difficulty,
        duration: r.duration,
        passingScore: r.passing_score,
        totalPoints: r.total_points,
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status,
        settings: r.settings ?? {},
        courseCode: r.course_code,
        courseName: r.course_name,
        professorName: r.profiles?.name ?? "",
      };
    });

  // Students should only see published/active/completed assessments
  const filtered = user.role === "student"
    ? assessments.filter((a) => ["published", "active", "completed"].includes(a.status))
    : assessments;

  return sendSuccess(c, filtered);
});

// ── Helpers ───────────────────────────────────────────────────────────
function mapClass(row: any) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description ?? "",
    department: row.department ?? "",
    teacherId: row.teacher_id,
    teacherName: row.profiles?.name ?? "",
    teacherEmail: row.profiles?.email ?? "",
    status: row.status,
    schedule: row.schedule ?? "",
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    studentCount: Array.isArray(row.class_enrollments) ? row.class_enrollments.length : 0,
  };
}

function mapClassDetail(row: any) {
  return {
    ...mapClass(row),
    students: (row.class_enrollments ?? []).map((e: any) => ({
      id: e.student_id,
      enrolledAt: e.enrolled_at,
      name: e.profiles?.name ?? "",
      email: e.profiles?.email ?? "",
      enrollmentId: e.profiles?.enrollment_id ?? "",
      department: e.profiles?.department ?? "",
    })),
  };
}

export default classes;
