export type ActionErrorCode =
  | "INTERNAL"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED";

export type AppServerError = {
  code: ActionErrorCode;
  message: string;
};

/**
 * Thrown inside server actions; surfaced to the client as `result.serverError`
 * with the given code/message (see handleServerError in lib/safe-action.ts).
 */
export class ActionError extends Error {
  readonly code: ActionErrorCode;

  constructor(code: ActionErrorCode, message: string) {
    super(message);
    this.name = "ActionError";
    this.code = code;
  }
}

/** True for Prisma unique-constraint violations (P2002). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
