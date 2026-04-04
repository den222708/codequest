import { Context, Next } from "hono";
import { createChildLogger } from "../lib/logger.js";

const log = createChildLogger({ module: "rateLimit" });

// ── Environment-driven defaults ───────────────────────────────────────
// These read from process.env at module load time; values in .env.example:
//   RATE_LIMIT_GLOBAL=100   RATE_LIMIT_AUTH=10   RATE_LIMIT_EXECUTE=20
export const RATE_LIMITS = {
  GLOBAL: parseInt(process.env.RATE_LIMIT_GLOBAL ?? "100", 10),
  AUTH: parseInt(process.env.RATE_LIMIT_AUTH ?? "10", 10),
  EXECUTE: parseInt(process.env.RATE_LIMIT_EXECUTE ?? "20", 10),
} as const;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimitStore {
  hit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult>;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, RateLimitEntry>();

  constructor() {
    const cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.buckets) {
        if (entry.resetAt <= now) this.buckets.delete(key);
      }
    }, 60_000);

    if (typeof cleanupTimer.unref === "function") {
      cleanupTimer.unref();
    }
  }

  async hit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.buckets.get(key);

    if (!entry || entry.resetAt <= now) {
      const resetAt = now + windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    entry.count++;
    return {
      allowed: entry.count <= maxRequests,
      remaining: Math.max(0, maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }
}

const memoryStore = new InMemoryRateLimitStore();

let redisStorePromise: Promise<RateLimitStore | null> | null = null;

function createRedisRateLimitStore(): Promise<RateLimitStore | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return Promise.resolve(null);

  return (async () => {
    try {
      const redisModule = await import("redis");
      const client = redisModule.createClient({ url: redisUrl });

      client.on("error", (err: unknown) => {
        log.error({ err }, "Redis rate limiter client error");
      });

      await client.connect();
      log.info({ redisUrl }, "Redis-backed rate limiter enabled");

      return {
        async hit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
          const redisKey = `rl:${key}`;

          const count = await client.incr(redisKey);
          if (count === 1) {
            await client.pExpire(redisKey, windowMs);
          }

          let ttlMs = await client.pTTL(redisKey);
          if (ttlMs <= 0) {
            await client.pExpire(redisKey, windowMs);
            ttlMs = windowMs;
          }

          return {
            allowed: count <= maxRequests,
            remaining: Math.max(0, maxRequests - count),
            resetAt: Date.now() + ttlMs,
          };
        },
      } satisfies RateLimitStore;
    } catch (err) {
      log.error({ err }, "Failed to initialize Redis rate limiter; falling back to in-memory store");
      return null;
    }
  })();
}

async function getRateLimitStore(): Promise<RateLimitStore> {
  if (!redisStorePromise) {
    redisStorePromise = createRedisRateLimitStore();
  }

  const redisStore = await redisStorePromise;
  return redisStore ?? memoryStore;
}

async function checkLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const store = await getRateLimitStore();
  try {
    return await store.hit(key, maxRequests, windowMs);
  } catch (err) {
    log.error({ err, key }, "Rate limit store failure; falling back to in-memory bucket");
    return memoryStore.hit(key, maxRequests, windowMs);
  }
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
    const result = await checkLimit(key, max, windowMs);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      return c.json(
        { success: false, error: "Too many requests. Please try again later." },
        429,
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
    const result = await checkLimit(key, max, windowMs);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      return c.json(
        { success: false, error: "Rate limit exceeded. Please slow down." },
        429,
      );
    }

    await next();
  };
}
