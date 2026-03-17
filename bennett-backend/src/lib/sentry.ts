/**
 * Sentry Error Tracking — backend integration.
 *
 * Initializes Sentry for server-side error capture.
 * Only active when SENTRY_DSN environment variable is set.
 *
 * Usage:
 *   import "./lib/sentry.js";  // call early in index.ts
 *   import { captureException, captureMessage } from "./lib/sentry.js";
 */

import * as Sentry from "@sentry/node";
import { logger } from "./logger.js";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.APP_VERSION ?? "1.0.0",
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    // Only send errors in production; in dev, log them
    beforeSend(event) {
      if (process.env.NODE_ENV !== "production") {
        logger.debug({ event: event.event_id }, "Sentry event (suppressed in dev)");
        return null;
      }
      return event;
    },
  });
  logger.info("Sentry error tracking initialized");
} else {
  logger.debug("Sentry DSN not configured — error tracking disabled");
}

/**
 * Capture an exception and send to Sentry (if configured).
 * Always safe to call even when Sentry is not initialized.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (dsn) {
    Sentry.captureException(error, { extra: context });
  }
}

/**
 * Capture a message and send to Sentry (if configured).
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (dsn) {
    Sentry.captureMessage(message, level);
  }
}

export default Sentry;
