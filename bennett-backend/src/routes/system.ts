import { Hono } from "hono";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { cacheStats } from "../lib/cache.js";
import type { AuthUser } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";

const system = new Hono<AppEnv>();

// ── GET /system/health ────────────────────────────────────────────────
// Public endpoint — no auth required
system.get("/health", async (c) => {
  let dbOk = false;
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("profiles").select("user_id", { count: "exact", head: true });
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const memUsage = process.memoryUsage();
  return sendSuccess(c, {
    status: dbOk ? "healthy" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbOk ? "connected" : "disconnected",
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    },
    cache: cacheStats(),
    nodeVersion: process.version,
  });
});

// All routes below require auth + admin
system.use("/*", authMiddleware);

// ── GET /system/logs ──────────────────────────────────────────────────
system.get("/logs", requireRole("admin"), async (c) => {
  const supabase = getSupabaseAdmin();
  const limit = Math.min(parseInt(c.req.query("limit") ?? "100"), 500);
  const action = c.req.query("action");
  const userId = c.req.query("userId");

  let query = supabase
    .from("activity_logs")
    .select(`
      *,
      profiles!activity_logs_user_id_fkey(name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action) query = query.eq("action", action);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: (row as any).profiles?.name ?? "",
    userEmail: (row as any).profiles?.email ?? "",
    action: row.action,
    details: row.details,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  })));
});

// ── POST /system/backups ───────────────────────────────────────────────
system.post("/backups", requireRole("admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const body = await c.req.json().catch(() => null);
  const name = body?.name;
  const type = body?.type ?? "full";
  const includes = body?.includes ?? [];

  if (!name || typeof name !== "string") {
    return sendError(c, 400, "name is required");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("backups")
    .insert({
      name,
      type,
      includes,
      status: "completed",
      size: 0,
      created_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, {
    id: data.id,
    name: data.name,
    type: data.type,
    size: data.size,
    status: data.status,
    includes: data.includes,
    createdBy: data.created_by,
    createdAt: data.created_at,
    completedAt: data.completed_at,
  }, 201);
});

// ── DELETE /system/backups/:id ─────────────────────────────────────────
system.delete("/backups/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("backups").delete().eq("id", id);
  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, { message: "Backup deleted" });
});

// ── PUT /system/plagiarism/:id/review ─────────────────────────────────
system.put("/plagiarism/:id/review", requireRole("teacher", "admin"), async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const status = body?.status;

  if (!status || !["cleared", "confirmed"].includes(status)) {
    return sendError(c, 400, "status must be 'cleared' or 'confirmed'");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("plagiarism_results")
    .update({
      status,
      flagged: status === "confirmed",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, {
    id: data.id,
    status: data.status,
    flagged: data.flagged,
    reviewedBy: data.reviewed_by,
    reviewedAt: data.reviewed_at,
  });
});

// ── GET /system/stats ─────────────────────────────────────────────────
system.get("/stats", requireRole("admin"), async (c) => {
  const supabase = getSupabaseAdmin();

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalAssessments },
    { count: activeAssessments },
    { count: totalSubmissions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("assessments").select("*", { count: "exact", head: true }),
    supabase.from("assessments").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("submissions").select("*", { count: "exact", head: true }),
  ]);

  return sendSuccess(c, {
    users: { total: totalUsers ?? 0, active: activeUsers ?? 0 },
    assessments: { total: totalAssessments ?? 0, active: activeAssessments ?? 0 },
    submissions: { total: totalSubmissions ?? 0 },
    cache: cacheStats(),
    memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

export default system;
