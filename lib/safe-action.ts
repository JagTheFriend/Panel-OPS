import { createSafeActionClient } from "next-safe-action";

import { getCurrentUser } from "@/lib/auth";
import { ActionError, type AppServerError } from "@/lib/errors";

export const actionClient = createSafeActionClient({
  handleServerError(e: unknown): AppServerError {
    if (e instanceof ActionError) {
      return { code: e.code, message: e.message };
    }
    console.error("[action] unhandled error:", e);
    return {
      code: "INTERNAL",
      message: "Something went wrong. Please try again.",
    };
  },
});

/** Requires a signed-in user; provides `ctx.user`. */
export const authedClient = actionClient.use(async ({ next }) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new ActionError(
      "UNAUTHENTICATED",
      "Session expired. Please sign in again.",
    );
  }
  return next({ ctx: { user } });
});
