/**
 * Structured logger — Pino-based, replaces all console.log/error/warn calls.
 *
 * Usage:
 *   import { logger } from "../lib/logger.js";
 *   logger.info("Server started");
 *   logger.error({ err, userId }, "Failed to insert record");
 *   logger.warn("CORS not set in production");
 *
 * In development: pretty-printed human-readable output.
 * In production: JSON lines for log aggregation.
 */

import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino/file",
          options: { destination: 1 }, // stdout
        },
      }),
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "codequest-api",
  },
});

/**
 * Create a child logger with additional context bindings.
 * Useful for per-module or per-request logging.
 */
export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

export default logger;
