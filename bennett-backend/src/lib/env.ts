import type { AuthUser } from "../middleware/auth.js";

/** Shared Hono environment type for typed context variables */
export type AppEnv = {
  Variables: {
    user: AuthUser;
    token: string;
  };
};
