import { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function sendSuccess(c: Context, data: unknown, status: ContentfulStatusCode = 200) {
  return c.json({ success: true, data, timestamp: new Date().toISOString() }, status);
}

export function sendError(c: Context, status: ContentfulStatusCode, message: string) {
  return c.json({ success: false, error: message, timestamp: new Date().toISOString() }, status);
}
