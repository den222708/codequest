import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import type { AuthUser, AppRole } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";
import crypto from "node:crypto";

const admin = new Hono<AppEnv>();
admin.use("*", authMiddleware);
admin.use("*", requireRole("admin"));

const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(["student", "teacher", "admin"]),
  department: z.string().max(100).optional(),
  enrollmentId: z.string().max(50).optional(),
  password: z.string().min(8).optional(),
});

const bulkUserSchema = z.object({
  users: z.array(
    z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      role: z.enum(["student", "teacher", "admin"]),
      department: z.string().max(100).optional(),
      enrollmentId: z.string().max(50).optional(),
    })
  ).min(1).max(500),
});

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let pw = "";
  for (let i = 0; i < 12; i++) {
    pw += chars[crypto.randomInt(chars.length)];
  }
  return pw;
}

// ── POST /admin/users ─────────────────────────────────────────────────
admin.post("/users", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const supabase = getSupabaseAdmin();
  const d = parsed.data;
  const password = d.password ?? generatePassword();

  // Check if email already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("email", d.email)
    .maybeSingle();

  if (existing) return sendError(c, 409, "An account with this email already exists");

  const { data, error } = await supabase.auth.admin.createUser({
    email: d.email,
    password,
    email_confirm: true,
    user_metadata: { name: d.name, role: d.role },
  });

  if (error) return sendError(c, 400, error.message);

  const { error: profileErr } = await supabase.from("profiles").insert({
    user_id: data.user.id,
    name: d.name,
    email: d.email,
    role: d.role as AppRole,
    department: d.department ?? null,
    enrollment_id: d.enrollmentId ?? null,
    status: "active",
  });

  if (profileErr) {
    // Clean up orphan auth user
    await supabase.auth.admin.deleteUser(data.user.id);
    return sendError(c, 500, "Failed to create user profile");
  }

  // Log
  const adminUser = c.get("user") as AuthUser;
  await supabase.from("activity_logs").insert({
    user_id: adminUser.id,
    action: "admin_create_user",
    details: { createdUserId: data.user.id, role: d.role, email: d.email },
    ip_address: c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
  }).then(({ error: logErr }) => { if (logErr) console.error("activity_log insert failed:", logErr.message); });

  return sendSuccess(c, {
    userId: data.user.id,
    email: d.email,
    name: d.name,
    role: d.role,
    generatedPassword: d.password ? undefined : password,
    message: "User created successfully",
  }, 201);
});

// ── POST /admin/users/bulk ────────────────────────────────────────────
admin.post("/users/bulk", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = bulkUserSchema.safeParse(body);
  if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

  const supabase = getSupabaseAdmin();
  const adminUser = c.get("user") as AuthUser;

  const created: Array<{ email: string; name: string; role: string; userId: string; password: string }> = [];
  const failed: Array<{ email: string; reason: string }> = [];

  for (const u of parsed.data.users) {
    const password = generatePassword();

    // Check duplicate
    const { data: existing } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", u.email)
      .maybeSingle();

    if (existing) {
      failed.push({ email: u.email, reason: "Email already exists" });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });

    if (error) {
      failed.push({ email: u.email, reason: error.message });
      continue;
    }

    const { error: profileErr } = await supabase.from("profiles").insert({
      user_id: data.user.id,
      name: u.name,
      email: u.email,
      role: u.role as AppRole,
      department: u.department ?? null,
      enrollment_id: u.enrollmentId ?? null,
      status: "active",
    });

    if (profileErr) {
      // Clean up orphan auth user
      await supabase.auth.admin.deleteUser(data.user.id);
      failed.push({ email: u.email, reason: "Profile creation failed" });
      continue;
    }

    created.push({
      email: u.email,
      name: u.name,
      role: u.role,
      userId: data.user.id,
      password,
    });
  }

  // Log bulk action
  await supabase.from("activity_logs").insert({
    user_id: adminUser.id,
    action: "admin_bulk_create_users",
    details: { totalRequested: parsed.data.users.length, created: created.length, failed: failed.length },
    ip_address: c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
  }).then(({ error: logErr }) => { if (logErr) console.error("activity_log insert failed:", logErr.message); });

  return sendSuccess(c, { created, failed, summary: { total: parsed.data.users.length, created: created.length, failed: failed.length } }, 201);
});

export default admin;
