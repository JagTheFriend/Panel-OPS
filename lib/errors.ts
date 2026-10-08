export type ActionErrorCode =
  | "INTERNAL"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT";

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
