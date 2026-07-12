import { createFinding, type MotionGuardFinding } from "../findings.js";
import { isVisuallyHidden } from "../trace.js";
import { framesForTarget, type TargetFrame } from "./helpers.js";
import type { MotionGuardRule } from "./types.js";

function remainsInteractive(entry: TargetFrame, opacityThreshold: number): boolean {
  const target = entry.target;
  if (!target.connected || !isVisuallyHidden(target, opacityThreshold)) return false;
  const pointerActive =
    target.visual.opacity <= opacityThreshold && target.visual.pointerEvents !== "none";
  return target.accessibility.focused || target.accessibility.focusable || pointerActive;
}

export const exitedButInteractiveRule: MotionGuardRule = Object.freeze({
  id: "exited-but-interactive",
  evaluate(trace, context): readonly MotionGuardFinding[] {
    const findings: MotionGuardFinding[] = [];

    for (const targetId of context.index.targetIds) {
      const entries = framesForTarget(context.index, targetId);
      let run: TargetFrame[] = [];

      const flush = (): void => {
        if (run.length === 0) return;
        const first = run[0];
        const last = run.at(-1);
        if (first === undefined || last === undefined) return;
        const durationMs = last.frame.atMs - first.frame.atMs;
        if (durationMs < context.options.exitedInteractive.minimumDurationMs) {
          run = [];
          return;
        }
        const focused = run.some((entry) => entry.target.accessibility.focused);
        const focusable = run.some((entry) => entry.target.accessibility.focusable);
        const pointerActive = run.some(
          (entry) =>
            entry.target.visual.pointerEvents !== "none" &&
            entry.target.visual.opacity <= context.options.exitedInteractive.opacityThreshold,
        );

        findings.push(
          createFinding({
            scenarioId: trace.scenarioId,
            ruleId: "exited-but-interactive",
            severity: "error",
            confidence: "high",
            targetId,
            title: "Visually exited element remains interactive",
            message: `The hidden target remained interactive for ${durationMs.toFixed(0)} ms${focused ? " and retained focus" : ""}.`,
            remediation:
              "Remove the element after exit or disable focusability and pointer interaction before it becomes visually unavailable.",
            evidence: {
              startMs: first.frame.atMs,
              endMs: last.frame.atMs,
              frameIndexes: run.map((entry) => entry.frameIndex),
              interactionIds: [],
              metrics: {
                durationMs,
                focused,
                focusable,
                pointerActive,
                minimumDurationMs: context.options.exitedInteractive.minimumDurationMs,
              },
            },
          }),
        );
        run = [];
      };

      for (const entry of entries) {
        if (remainsInteractive(entry, context.options.exitedInteractive.opacityThreshold))
          run.push(entry);
        else flush();
      }
      flush();
    }

    return Object.freeze(findings);
  },
});
