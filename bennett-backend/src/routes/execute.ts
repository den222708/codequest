import { Hono } from "hono";
import { z } from "zod";
import { sendSuccess, sendError } from "../lib/response.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimit, userRateLimit, RATE_LIMITS } from "../middleware/rateLimit.js";
import { LANGUAGES, LANGUAGE_MAP } from "../lib/languages.js";
import { executeCodeStream } from "../services/executionDispatcher.js";
import { runTests } from "../services/testRunner.js";
import type { AuthUser } from "../middleware/auth.js";
import type { AppEnv } from "../lib/env.js";

const execute = new Hono<AppEnv>();
execute.use("*", authMiddleware);

const executeSchema = z.object({
  code: z.string().min(1).max(50000),
  language: z.string(),
});

const runTestsSchema = z.object({
  code: z.string().min(1).max(50000),
  language: z.string(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().default(false),
        points: z.number().int().min(0).default(0),
        timeLimit: z.number().int().min(100).default(28000),
      })
    )
    .min(1),
});

// ── GET /execute/languages ────────────────────────────────────────────
execute.get("/languages", (c) => {
  return sendSuccess(c, LANGUAGES.map((l) => ({
    key: l.id,
    label: l.label,
    extension: l.extension,
  })));
});

// ── POST /execute ─────────────────────────────────────────────────────
// Returns SSE stream of execution output
execute.post(
  "/",
  userRateLimit({ max: RATE_LIMITS.EXECUTE, windowMs: 60_000, keyPrefix: "exec" }),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = executeSchema.safeParse(body);
    if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

    const { code, language } = parsed.data;
    if (!LANGUAGE_MAP[language]) {
      return sendError(c, 400, `Unsupported language: ${language}. Supported: ${LANGUAGES.map((l) => l.id).join(", ")}`);
    }

    const stream = executeCodeStream(code, language);
    if (!stream) return sendError(c, 400, "Failed to create execution stream");

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }
);

// ── POST /execute/run-tests ───────────────────────────────────────────
execute.post(
  "/run-tests",
  userRateLimit({ max: Math.ceil(RATE_LIMITS.EXECUTE / 2), windowMs: 60_000, keyPrefix: "tests" }),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = runTestsSchema.safeParse(body);
    if (!parsed.success) return sendError(c, 400, parsed.error.errors[0].message);

    const { code, language, testCases } = parsed.data;
    if (!LANGUAGE_MAP[language]) {
      return sendError(c, 400, `Unsupported language: ${language}`);
    }

    const normalizedTestCases = testCases.map((tc) => ({
      input: tc.input ?? "",
      expectedOutput: tc.expectedOutput ?? "",
      isHidden: tc.isHidden ?? false,
      points: tc.points ?? 0,
      timeLimit: tc.timeLimit ?? 28000,
    }));

    const results = await runTests(code, language, normalizedTestCases);
    return sendSuccess(c, results);
  }
);

export default execute;
