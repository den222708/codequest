import { Hono } from "hono";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthUser } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";

const notifications = new Hono<AppEnv>();
notifications.use("*", authMiddleware);

// ── GET /notifications ───────────────────────────────────────────────
notifications.get("/", async (c) => {
  const user = c.get("user") as AuthUser;
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 200);
  const unreadOnly = c.req.query("unread") === "true";

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;
  if (error) return sendError(c, 500, error.message);

  return sendSuccess(c, (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.is_read,
    link: n.link,
    createdAt: n.created_at,
  })));
});

// ── GET /notifications/unread-count ──────────────────────────────────
notifications.get("/unread-count", async (c) => {
  const user = c.get("user") as AuthUser;
  const supabase = getSupabaseAdmin();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return sendError(c, 500, error.message);
  return sendSuccess(c, { count: count ?? 0 });
});

// ── PUT /notifications/:id/read ──────────────────────────────────────
notifications.put("/:id/read", async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return sendError(c, 500, error.message);
  return sendSuccess(c, { message: "Notification marked as read" });
});

// ── PUT /notifications/read-all ──────────────────────────────────────
notifications.put("/read-all", async (c) => {
  const user = c.get("user") as AuthUser;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return sendError(c, 500, error.message);
  return sendSuccess(c, { message: "All notifications marked as read" });
});

// ── DELETE /notifications/:id ────────────────────────────────────────
notifications.delete("/:id", async (c) => {
  const user = c.get("user") as AuthUser;
  const id = c.req.param("id");
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return sendError(c, 500, error.message);
  return sendSuccess(c, { message: "Notification deleted" });
});

// ── DELETE /notifications (clear all) ────────────────────────────────
notifications.delete("/", async (c) => {
  const user = c.get("user") as AuthUser;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id);

  if (error) return sendError(c, 500, error.message);
  return sendSuccess(c, { message: "All notifications cleared" });
});

export default notifications;
