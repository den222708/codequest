import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
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
import { rateLimit } from "./middleware/rateLimit.js";

const app = new Hono();

// ── Global middleware ─────────────────────────────────────────────────
app.use("*", logger());

if (!process.env.CORS_ORIGINS && process.env.NODE_ENV === "production") {
  console.warn("[CodeQuest] CORS_ORIGINS not set in production — defaulting to localhost only.");
}

app.use(
  "*",
  cors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:3000")
      .split(",")
      .map((s) => s.trim()),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    maxAge: 86400,
    credentials: true,
  })
);

// Global rate limit: 200 requests/min per IP
app.use("*", rateLimit({ max: 200, windowMs: 60_000, keyPrefix: "global" }));

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
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message);
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

// ── Start server ──────────────────────────────────────────────────────
const port = parseInt(process.env.PORT ?? "3001");

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`\n  Bennett CodeQuest API running on http://localhost:${info.port}\n`);
});

export default app;
