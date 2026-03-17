import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { rateLimit, userRateLimit, RATE_LIMITS } from "./rateLimit.js";

describe("RATE_LIMITS constants", () => {
  it("exports expected keys", () => {
    expect(RATE_LIMITS).toHaveProperty("GLOBAL");
    expect(RATE_LIMITS).toHaveProperty("AUTH");
    expect(RATE_LIMITS).toHaveProperty("EXECUTE");
  });

  it("has numeric values", () => {
    expect(typeof RATE_LIMITS.GLOBAL).toBe("number");
    expect(typeof RATE_LIMITS.AUTH).toBe("number");
    expect(typeof RATE_LIMITS.EXECUTE).toBe("number");
  });

  it("defaults are reasonable", () => {
    expect(RATE_LIMITS.GLOBAL).toBeGreaterThanOrEqual(10);
    expect(RATE_LIMITS.AUTH).toBeGreaterThanOrEqual(1);
    expect(RATE_LIMITS.EXECUTE).toBeGreaterThanOrEqual(1);
  });
});

describe("rateLimit middleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use(
      "/test/*",
      rateLimit({ max: 3, windowMs: 5000, keyPrefix: "test-rl" })
    );
    app.get("/test/hello", (c) => c.json({ ok: true }));
  });

  it("allows requests under the limit", async () => {
    // Use unique IPs to avoid interference from other tests
    const res = await app.request("/test/hello", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("3");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("2");
  });

  it("returns 429 when limit exceeded", async () => {
    const ip = "10.0.0.2";
    const headers = { "x-forwarded-for": ip };

    await app.request("/test/hello", { headers });
    await app.request("/test/hello", { headers });
    await app.request("/test/hello", { headers });

    const res = await app.request("/test/hello", { headers });
    expect(res.status).toBe(429);

    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.error).toContain("Too many requests");
  });

  it("sets rate limit headers", async () => {
    const ip = "10.0.0.3";
    const res = await app.request("/test/hello", {
      headers: { "x-forwarded-for": ip },
    });
    expect(res.headers.get("X-RateLimit-Limit")).toBeTruthy();
    expect(res.headers.get("X-RateLimit-Remaining")).toBeTruthy();
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("different IPs have separate buckets", async () => {
    const headers1 = { "x-forwarded-for": "10.0.0.4" };
    const headers2 = { "x-forwarded-for": "10.0.0.5" };

    // Exhaust IP 1's limit
    await app.request("/test/hello", { headers: headers1 });
    await app.request("/test/hello", { headers: headers1 });
    await app.request("/test/hello", { headers: headers1 });

    const res1 = await app.request("/test/hello", { headers: headers1 });
    expect(res1.status).toBe(429);

    // IP 2 should still work
    const res2 = await app.request("/test/hello", { headers: headers2 });
    expect(res2.status).toBe(200);
  });
});

describe("userRateLimit middleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    // Simulate setting a user on the context
    app.use("/test/*", async (c, next) => {
      (c as any).set("user", { id: "user-123" });
      await next();
    });
    app.use(
      "/test/*",
      userRateLimit({ max: 2, windowMs: 5000, keyPrefix: "test-url" })
    );
    app.get("/test/data", (c) => c.json({ ok: true }));
  });

  it("limits per user ID", async () => {
    const ip = "10.0.0.10";
    const headers = { "x-forwarded-for": ip };

    await app.request("/test/data", { headers });
    await app.request("/test/data", { headers });

    const res = await app.request("/test/data", { headers });
    expect(res.status).toBe(429);
  });
});
