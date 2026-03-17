// Sentry must be imported before other modules to instrument them
import "./lib/sentry.js";

import { createServer } from "node:http";
import { getRequestListener } from "@hono/node-server";
import app, { CORS_ORIGINS } from "./app.js";
import { createSocketServer } from "./services/socketServer.js";
import { logger } from "./lib/logger.js";
import { startCleanupJobs, stopCleanupJobs } from "./lib/cleanupJobs.js";

const port = parseInt(process.env.PORT ?? "3001");

// Create a raw Node.js HTTP server with Hono's request handler
const httpServer = createServer(getRequestListener(app.fetch));

// Attach Socket.IO to the same HTTP server
createSocketServer(httpServer, CORS_ORIGINS);

httpServer.listen(port, () => {
  logger.info({ port, namespaces: ["/proctoring", "/admin"] }, "Bennett CodeQuest API started");

  // Start periodic cleanup jobs (token purge, stale sessions, old monitoring events)
  startCleanupJobs();
});

// ── Graceful shutdown ──────────────────────────────────────────────────
function handleShutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received");
  stopCleanupJobs();
  httpServer.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  // Force exit after 10 seconds if graceful shutdown takes too long
  setTimeout(() => process.exit(1), 10_000);
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
