/**
 * Cleanup Jobs — periodic maintenance tasks.
 *
 * Purges:
 *   - Expired token_blacklist entries (tokens older than JWT max age)
 *   - Stale active_sessions (sessions with no activity for > 24 hours)
 *   - Old monitoring_events (events older than 90 days, configurable)
 *
 * Runs on a configurable interval (default: every 60 minutes).
 * Safe to call multiple times — tracks its own timer.
 */

import { getSupabaseAdmin } from "./supabase.js";
import { logger } from "./logger.js";

const CLEANUP_INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_MINUTES ?? "60", 10) * 60 * 1000;
const TOKEN_MAX_AGE_HOURS = parseInt(process.env.TOKEN_MAX_AGE_HOURS ?? "24", 10);
const SESSION_STALE_HOURS = parseInt(process.env.SESSION_STALE_HOURS ?? "24", 10);
const MONITORING_RETENTION_DAYS = parseInt(process.env.MONITORING_RETENTION_DAYS ?? "90", 10);

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Purge expired entries from token_blacklist.
 * Tokens are blacklisted on logout; once their JWT has expired, the
 * blacklist entry is no longer needed.
 */
async function purgeExpiredTokens(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - TOKEN_MAX_AGE_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("token_blacklist")
    .delete()
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    logger.error({ err: error.message }, "Failed to purge expired tokens");
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Purge stale active_sessions.
 * Sessions that have not been updated in SESSION_STALE_HOURS are
 * considered abandoned and should be cleaned up.
 */
async function purgeStaleActiveSessions(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - SESSION_STALE_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("active_sessions")
    .delete()
    .lt("last_active_at", cutoff)
    .select("id");

  if (error) {
    logger.error({ err: error.message }, "Failed to purge stale sessions");
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Purge old monitoring_events beyond retention period.
 */
async function purgeOldMonitoringEvents(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - MONITORING_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("monitoring_events")
    .delete()
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    logger.error({ err: error.message }, "Failed to purge old monitoring events");
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Run all cleanup tasks once.
 */
export async function runCleanup(): Promise<void> {
  const start = Date.now();
  logger.info("Cleanup job started");

  try {
    const [tokens, sessions, events] = await Promise.all([
      purgeExpiredTokens(),
      purgeStaleActiveSessions(),
      purgeOldMonitoringEvents(),
    ]);

    const elapsed = Date.now() - start;
    logger.info(
      { purged: { tokens, sessions, events }, elapsedMs: elapsed },
      "Cleanup job completed"
    );
  } catch (err) {
    logger.error({ err }, "Cleanup job failed");
  }
}

/**
 * Start the periodic cleanup timer.
 */
export function startCleanupJobs(): void {
  if (cleanupTimer) return;

  // Run once immediately on startup (after a short delay to let DB connect)
  setTimeout(() => runCleanup(), 10_000);

  // Then run periodically
  cleanupTimer = setInterval(() => runCleanup(), CLEANUP_INTERVAL_MS);

  logger.info(
    { intervalMinutes: CLEANUP_INTERVAL_MS / 60_000 },
    "Cleanup jobs scheduled"
  );
}

/**
 * Stop the cleanup timer (for graceful shutdown).
 */
export function stopCleanupJobs(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
