import { Context, Next } from "hono";

// ── Environment-driven defaults ───────────────────────────────────────
// These read from process.env at module load time; values in .env.example:
//   RATE_LIMIT_GLOBAL=100   RATE_LIMIT_AUTH=10   RATE_LIMIT_EXECUTE=20
export const RATE_LIMITS = {
  GLOBAL:  parseInt(process.env.RATE_LIMIT_GLOBAL  ?? "100", 10),
  AUTH:    parseInt(process.env.RATE_LIMIT_AUTH     ?? "10",  10),
  EXECUTE: parseInt(process.env.RATE_LIMIT_EXECUTE ?? "20",  10),
} as const;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}, 60_000);

function checkLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  return { allowed: entry.count <= maxRequests, remaining, resetAt: entry.resetAt };
}

function getClientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    c.req.header("cf-connecting-ip") ||
    "unknown"
  );
}

/** Create a rate limiter middleware */
export function rateLimit(opts: { max: number; windowMs?: number; keyPrefix?: string }) {
  const { max, windowMs = 60_000, keyPrefix = "global" } = opts;

  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    const key = `${keyPrefix}:${ip}`;
    const result = checkLimit(key, max, windowMs);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      return c.json(
        { success: false, error: "Too many requests. Please try again later." },
        429
      );
    }

    await next();
  };
}

/** Per-user rate limiter (uses authenticated user ID instead of IP) */
export function userRateLimit(opts: { max: number; windowMs?: number; keyPrefix?: string }) {
  const { max, windowMs = 60_000, keyPrefix = "user" } = opts;

  return async (c: Context, next: Next) => {
    const user = c.get("user") as { id: string } | undefined;
    const key = `${keyPrefix}:${user?.id ?? getClientIp(c)}`;
    const result = checkLimit(key, max, windowMs);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      return c.json(
        { success: false, error: "Rate limit exceeded. Please slow down." },
        429
      );
    }

    await next();
  };
}
