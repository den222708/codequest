import { Context, Next } from "hono";
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { createChildLogger } from "../lib/logger.js";

const log = createChildLogger({ module: "auth-middleware" });

export type AppRole = "student" | "teacher" | "admin";

const VALID_ROLES: ReadonlySet<string> = new Set<AppRole>(["student", "teacher", "admin"]);

/** 30-minute inactivity timeout (in milliseconds) */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/** 90-day password expiry (in milliseconds) */
const PASSWORD_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000;

/** Hash a JWT for blacklist storage (avoids storing raw tokens) */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  name: string;
}

/** Extract and verify JWT from Authorization header via Supabase */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseAdmin();

  // Check if token is blacklisted (revoked on logout)
  const tokenHash = hashToken(token);
  const { data: blacklisted } = await supabase
    .from("token_blacklist")
    .select("token_hash")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (blacklisted) {
    return c.json({ success: false, error: "Token has been revoked" }, 401);
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }

  // ── Session timeout check ─────────────────────────────────────────
  const { data: session } = await supabase
    .from("active_sessions")
    .select("id, last_active_at")
    .eq("user_id", data.user.id)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (session) {
    const lastActive = new Date(session.last_active_at).getTime();
    if (Date.now() - lastActive > SESSION_TIMEOUT_MS) {
      // Session timed out — clean up and reject
      await supabase.from("active_sessions").delete().eq("id", session.id);
      await supabase.from("token_blacklist").upsert({
        token_hash: tokenHash,
        user_id: data.user.id,
        revoked_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      }, { onConflict: 'token_hash' });
      return c.json({ success: false, error: "Session expired due to inactivity" }, 401);
    }

    // Update last_active_at — awaited to ensure session timeout checks use fresh data
    const { error: updateErr } = await supabase
      .from("active_sessions")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", session.id);
    if (updateErr) log.error({ err: updateErr }, "active_sessions update failed");
  }
  // Note: if no session record found (e.g. legacy tokens before this feature),
  // we still allow the request — the session table is populated on new logins.

  // Fetch profile to get role + name + password expiry
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("name, role, password_changed_at")
    .eq("user_id", data.user.id)
    .single();

  if (profileErr || !profile) {
    return c.json({ success: false, error: "User profile not found" }, 403);
  }

  // Check 90-day password expiry (skip for auth/change-password endpoint)
  if (profile.password_changed_at && !c.req.path.includes("/auth/change-password")) {
    const changedAt = new Date(profile.password_changed_at).getTime();
    if (Date.now() - changedAt > PASSWORD_EXPIRY_MS) {
      return c.json({ success: false, error: "Password expired. Please change your password.", code: "PASSWORD_EXPIRED" }, 403);
    }
  }

  const role = VALID_ROLES.has(profile.role) ? (profile.role as AppRole) : "student";

  const user: AuthUser = {
    id: data.user.id,
    email: data.user.email ?? "",
    role,
    name: profile.name ?? data.user.email ?? "",
  };

  c.set("user", user);
  c.set("token", token);
  await next();
}

/** Role guard — check if user has one of the allowed roles */
export function requireRole(...roles: AppRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as AuthUser | undefined;
    if (!user) {
      return c.json({ success: false, error: "Authentication required" }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({ success: false, error: "Insufficient permissions" }, 403);
    }
    await next();
  };
}
