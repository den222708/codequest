import { Hono } from "hono";
import { cors } from "hono/cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import questionRoutes from "./routes/questions.js";
import assessmentRoutes from "./routes/assessments.js";
import submissionRoutes from "./routes/submissions.js";
import executeRoutes from "./routes/execute.js";
import analyticsRoutes from "./routes/analytics.js";
import systemRoutes from "./routes/system.js";
import classRoutes from "./routes/classes.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { logger, createChildLogger } from "./lib/logger.js";

const log = createChildLogger({ module: "app" });

const app = new Hono();

// ── CORS origins (exported for Socket.IO server) ────────────────────
export const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

// ── Pino HTTP request logger ──────────────────────────────────────────
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info({ method: c.req.method, path: c.req.path, status: c.res.status, ms }, "request");
});

if (!process.env.CORS_ORIGINS && process.env.NODE_ENV === "production") {
  log.warn("CORS_ORIGINS not set in production — defaulting to localhost only");
}

app.use(
  "*",
  cors({
    origin: CORS_ORIGINS,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    maxAge: 86400,
    credentials: true,
  })
);

// Global rate limit (reads RATE_LIMIT_GLOBAL env var, default 100)
const globalMax = parseInt(process.env.RATE_LIMIT_GLOBAL ?? "100", 10);
app.use("*", rateLimit({ max: globalMax, windowMs: 60_000, keyPrefix: "global" }));

// ── Routes ────────────────────────────────────────────────────────────
const api = new Hono();
api.route("/auth", authRoutes);
api.route("/users", userRoutes);
api.route("/questions", questionRoutes);
api.route("/assessments", assessmentRoutes);
api.route("/submissions", submissionRoutes);
api.route("/execute", executeRoutes);
api.route("/analytics", analyticsRoutes);
api.route("/system", systemRoutes);
api.route("/classes", classRoutes);
api.route("/admin", adminRoutes);
api.route("/notifications", notificationRoutes);

app.route("/api/v1", api);

// ── Root ──────────────────────────────────────────────────────────────
app.get("/", (c) =>
  c.json({
    name: "Bennett CodeQuest API",
    version: "1.0.0",
    status: "running",
    docs: "/system/health",
  })
);

// ── Global error handler ──────────────────────────────────────────────
app.onError((err, c) => {
  log.error({ err, method: c.req.method, path: c.req.path }, "Unhandled error");
  return c.json(
    { success: false, error: "Internal server error", timestamp: new Date().toISOString() },
    500
  );
});

app.notFound((c) =>
  c.json(
    { success: false, error: "Not found", timestamp: new Date().toISOString() },
    404
  )
);

export default app;
