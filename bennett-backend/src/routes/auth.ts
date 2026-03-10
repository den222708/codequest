import { Hono } from "hono";
import { z } from "zod";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { hashToken } from "../middleware/auth.js";
import type { AppRole } from "../middleware/auth.js";

const auth = new Hono();

// ── Lockout configuration ─────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CONCURRENT_SESSIONS = 2;

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

// ── Helper: check and enforce account lockout ─────────────────────────
async function checkLockout(supabase: ReturnType<typeof getSupabaseAdmin>, email: string): Promise<{ locked: boolean; minutesRemaining?: number }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("failed_login_attempts, locked_until")
    .eq("email", email)
    .maybeSingle();

  if (!profile) return { locked: false };

  if (profile.locked_until) {
    const lockedUntil = new Date(profile.locked_until).getTime();
    const now = Date.now();
    if (lockedUntil > now) {
      return { locked: true, minutesRemaining: Math.ceil((lockedUntil - now) / 60_000) };
    }
    // Lockout expired — reset
    await supabase
      .from("profiles")
      .update({ failed_login_attempts: 0, locked_until: null })
      .eq("email", email);
  }
  return { locked: false };
}

async function recordFailedLogin(supabase: ReturnType<typeof getSupabaseAdmin>, email: string): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("failed_login_attempts")
    .eq("email", email)
    .maybeSingle();

  if (!profile) return;

  const newCount = (profile.failed_login_attempts ?? 0) + 1;
  const update: Record<string, unknown> = { failed_login_attempts: newCount };

  if (newCount >= MAX_FAILED_ATTEMPTS) {
    update.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
  }

  await supabase.from("profiles").update(update).eq("email", email);
}

async function resetFailedLogins(supabase: ReturnType<typeof getSupabaseAdmin>, email: string): Promise<void> {
  await supabase
    .from("profiles")
    .update({ failed_login_attempts: 0, locked_until: null })
    .eq("email", email);
}

// ── Helper: manage concurrent sessions ────────────────────────────────
async function enforceSessionLimit(supabase: ReturnType<typeof getSupabaseAdmin>, userId: string, newTokenHash: string, ip: string): Promise<void> {
  // Insert new session
  await supabase.from("active_sessions").insert({
    user_id: userId,
    token_hash: newTokenHash,
    ip_address: ip,
    last_active_at: new Date().toISOString(),
  });

  // Check count
  const { data: sessions } = await supabase
    .from("active_sessions")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (sessions && sessions.length > MAX_CONCURRENT_SESSIONS) {
    // Remove oldest sessions to stay within limit
    const toRemove = sessions.slice(0, sessions.length - MAX_CONCURRENT_SESSIONS);
    const idsToRemove = toRemove.map((s) => s.id);
    await supabase.from("active_sessions").delete().in("id", idsToRemove);
  }
}

// ── POST /auth/login ──────────────────────────────────────────────────
auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return sendError(c, 400, parsed.error.errors[0].message);
  }

  const { email, password } = parsed.data;
  const supabase = getSupabaseAdmin();
  const clientIp = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Check lockout before attempting login
  const lockStatus = await checkLockout(supabase, email);
  if (lockStatus.locked) {
    return sendError(c, 429, `Account locked due to too many failed attempts. Try again in ${lockStatus.minutesRemaining} minute(s).`);
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Record failed attempt
    await recordFailedLogin(supabase, email);
    return sendError(c, 401, "Invalid email or password");
  }

  // Reset failed login counter on success
  await resetFailedLogins(supabase, email);

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .single();

  // Manage concurrent sessions (evict oldest if over limit)
  const tokenHash = hashToken(data.session.access_token);
  await enforceSessionLimit(supabase, data.user.id, tokenHash, clientIp);

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: data.user.id,
    action: "login",
    details: { method: "password" },
    ip_address: clientIp,
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

  // Sign in immediately so the frontend receives a session (same shape as login)
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError || !loginData.session) {
    // Account was created but auto-login failed — return userId so frontend can login manually
    return sendSuccess(c, { message: "Account created successfully", userId: data.user.id }, 201);
  }

  return sendSuccess(c, {
    user: {
      id: data.user.id,
      email,
      name,
      role: role as AppRole,
      avatar: "",
      department: department ?? "",
      enrollmentId: enrollmentId ?? "",
      status: "active",
    },
    session: {
      accessToken: loginData.session.access_token,
      refreshToken: loginData.session.refresh_token,
      expiresAt: loginData.session.expires_at,
    },
  }, 201);
});

// ── POST /auth/logout ─────────────────────────────────────────────────
auth.post("/logout", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return sendSuccess(c, { message: "Logged out" });
  }

  const supabase = getSupabaseAdmin();
  const token = authHeader.slice(7);

  // Blacklist the token so it can't be reused after logout
  const tokenHash = hashToken(token);
  const { data: userData } = await supabase.auth.getUser(token);
  if (userData?.user) {
    // Set expiry to 1 hour from now (tokens expire; cleanup can purge old entries)
    await supabase.from("token_blacklist").upsert({
      token_hash: tokenHash,
      user_id: userData.user.id,
      revoked_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    }).then(({ error }) => {
      if (error) console.error("token_blacklist upsert failed:", error.message);
    });

    // Remove from active sessions
    await supabase.from("active_sessions")
      .delete()
      .eq("user_id", userData.user.id)
      .eq("token_hash", tokenHash)
      .then(({ error }) => {
        if (error) console.error("active_sessions delete failed:", error.message);
      });

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
