export type MotionGuardPlaywrightErrorCode =
  | "ABORTED"
  | "BROWSER_DISCONNECTED"
  | "CLEANUP_FAILED"
  | "DUPLICATE_TARGET"
  | "INVALID_CONFIGURATION"
  | "NAVIGATION_FAILED"
  | "PAGE_CLOSED"
  | "PAGE_CRASHED"
  | "REMOTE_ORIGIN_NOT_ALLOWED"
  | "TARGET_NOT_FOUND"
  | "TIMEOUT";

export class MotionGuardPlaywrightError extends Error {
  readonly code: MotionGuardPlaywrightErrorCode;
  override readonly cause?: unknown;

  constructor(code: MotionGuardPlaywrightErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "MotionGuardPlaywrightError";
    this.code = code;
    this.cause = cause;
  }
}
