import type { MotionGuardRunSummary } from "@motionguard/core";

function escapeJsonLineSeparators(value: string): string {
  return value.replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
}

export function serializeRunSummary(summary: MotionGuardRunSummary): string {
  return escapeJsonLineSeparators(JSON.stringify(summary, null, 2));
}
