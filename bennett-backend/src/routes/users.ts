import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import type { AuthUser } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";

const users = new Hono<AppEnv>();
users.use("*", authMiddleware);

// ── GET /users ────────────────────────────────────────────────────────
users.get("/", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const supabase = getSupabaseAdmin();

  const role = c.req.query("role");
  const status = c.req.query("status");
  const search = c.req.query("search");

  let query = supabase.from("profiles").select("*");

  // Teachers can only see students
  if (user.role === "teacher") {
    query = query.eq("role", "student");
  } else if (role) {
    query = query.eq("role", role);
  }

  if (status) query = query.eq("status", status);
  if (search) {
    // Sanitize for PostgREST filter syntax — strip characters with special meaning
    const safe = search.replace(/[%_(),.*]/g, "");
    if (safe) query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return sendError(c, 500, error.message);

  const mapped = (data ?? []).map(mapProfile);
  return sendSuccess(c, mapped);
});

// ── GET /users/:id ────────────────────────────────────────────────────
users.get("/:id", async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  // Students can only view own profile
  if (user.role === "student" && user.id !== id) {
    return sendError(c, 403, "Cannot view other users' profiles");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", id)
    .single();

  if (error || !data) return sendError(c, 404, "User not found");

  // Teachers can only see students
  if (user.role === "teacher" && data.role !== "student" && user.id !== id) {
    return sendError(c, 403, "Insufficient permissions");
  }

  return sendSuccess(c, mapProfile(data));
});

// ── PUT /users/:id ────────────────────────────────────────────────────
const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  department: z.string().optional(),
  enrollmentId: z.string().optional(),
  avatar_url: z.string().url().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  role: z.enum(["student", "teacher", "admin"]).optional(),
});

users.put("/:id", async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");

  // Only admin can update others, or user can update self (limited fields)
  if (user.role !== "admin" && user.id !== id) {
    return sendError(c, 403, "Can only update your own profile");
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const d = parsed.data;

  if (d.name) updates.name = d.name;
  if (d.department !== undefined) updates.department = d.department;
  if (d.enrollmentId !== undefined) updates.enrollment_id = d.enrollmentId;
  if (d.avatar_url !== undefined) updates.avatar_url = d.avatar_url;

  // Only admin can change role and status
  if (user.role === "admin") {
    if (d.status) updates.status = d.status;
    if (d.role) updates.role = d.role;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", id)
    .select()
    .single();

  if (error) return sendError(c, 500, error.message);
  return sendSuccess(c, mapProfile(data));
});

// ── DELETE /users/:id ─────────────────────────────────────────────────
users.delete("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id")!;
  const user = c.get("user") as AuthUser;

  if (user.id === id) return sendError(c, 400, "Cannot delete your own account");

  const supabase = getSupabaseAdmin();
  const { error: profileErr } = await supabase.from("profiles").delete().eq("user_id", id);
  if (profileErr) return sendError(c, 500, profileErr.message);

  const { error: authErr } = await supabase.auth.admin.deleteUser(id);
  if (authErr) return sendError(c, 500, authErr.message);

  return sendSuccess(c, { message: "User deleted" });
});

// ── Helper ────────────────────────────────────────────────────────────
function mapProfile(row: any) {
  return {
    id: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar_url ?? "",
    department: row.department ?? "",
    enrollmentId: row.enrollment_id ?? "",
    status: row.status ?? "active",
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}

export default users;
