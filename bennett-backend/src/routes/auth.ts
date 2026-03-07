import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import type { AppRole } from "../middleware/auth.js";

const auth = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a digit")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  role: z.enum(["student", "teacher"]),
  department: z.string().optional(),
  enrollmentId: z.string().optional(),
});

// ── POST /auth/login ──────────────────────────────────────────────────
auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return sendError(c, 400, parsed.error.errors[0].message);
  }

  const { email, password } = parsed.data;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return sendError(c, 401, "Invalid email or password");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .single();

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: data.user.id,
    action: "login",
    details: { method: "password" },
    ip_address: c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
  }).then(({ error: logErr }) => { if (logErr) console.error("activity_log insert failed:", logErr.message); });

  return sendSuccess(c, {
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name ?? "",
      role: profile?.role ?? "student",
      avatar: profile?.avatar_url ?? "",
      department: profile?.department ?? "",
      enrollmentId: profile?.enrollment_id ?? "",
      status: profile?.status ?? "active",
    },
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    },
  });
});

// ── POST /auth/signup ─────────────────────────────────────────────────
auth.post("/signup", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return sendError(c, 400, parsed.error.errors[0].message);
  }

  const { name, email, password, role, department, enrollmentId } = parsed.data;
  const supabase = getSupabaseAdmin();

  // Check if email already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return sendError(c, 409, "An account with this email already exists");
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (error) {
    return sendError(c, 400, error.message);
  }

  // Create profile row
  await supabase.from("profiles").insert({
    user_id: data.user.id,
    name,
    email,
    role: role as AppRole,
    department: department ?? null,
    enrollment_id: enrollmentId ?? null,
    status: "active",
  });

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: data.user.id,
    action: "signup",
    details: { role },
    ip_address: c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
  }).then(({ error: logErr }) => { if (logErr) console.error("activity_log insert failed:", logErr.message); });

  return sendSuccess(c, { message: "Account created successfully", userId: data.user.id }, 201);
});

// ── POST /auth/logout ─────────────────────────────────────────────────
auth.post("/logout", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return sendSuccess(c, { message: "Logged out" });
  }

  const supabase = getSupabaseAdmin();
  // Supabase admin API doesn't have a signOut-by-token, but we can invalidate via admin
  // The client should discard tokens. Server-side, we log the event.
  const token = authHeader.slice(7);
  const { data: userData } = await supabase.auth.getUser(token);
  if (userData?.user) {
    await supabase.from("activity_logs").insert({
      user_id: userData.user.id,
      action: "logout",
      details: {},
      ip_address: c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
    }).then(({ error: logErr }) => { if (logErr) console.error("activity_log insert failed:", logErr.message); });
  }

  return sendSuccess(c, { message: "Logged out successfully" });
});

// ── POST /auth/refresh ────────────────────────────────────────────────
auth.post("/refresh", async (c) => {
  const body = await c.req.json().catch(() => null);
  const refreshToken = body?.refreshToken;
  if (!refreshToken) {
    return sendError(c, 400, "refreshToken is required");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) {
    return sendError(c, 401, "Invalid or expired refresh token");
  }

  return sendSuccess(c, {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
  });
});

// ── POST /auth/forgot-password ────────────────────────────────────────
auth.post("/forgot-password", async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = body?.email;
  if (!email || typeof email !== "string") {
    return sendError(c, 400, "email is required");
  }

  const supabase = getSupabaseAdmin();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL ?? "https://bennett.codequest.qzz.io"}/reset-password`,
  });

  // Always return success to avoid email enumeration
  return sendSuccess(c, { message: "If an account exists, a reset email has been sent" });
});

export default auth;
