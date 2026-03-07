import { Context, Next } from "hono";
import { getSupabaseAdmin } from "../lib/supabase.js";

export type AppRole = "student" | "teacher" | "admin";

const VALID_ROLES: ReadonlySet<string> = new Set<AppRole>(["student", "teacher", "admin"]);

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

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }

  // Fetch profile to get role + name
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("user_id", data.user.id)
    .single();

  if (profileErr || !profile) {
    return c.json({ success: false, error: "User profile not found" }, 403);
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
