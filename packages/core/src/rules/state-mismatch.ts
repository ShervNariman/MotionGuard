import { createFinding, type MotionGuardFinding } from "../findings.js";
import {
  isVisuallyHidden,
  type MotionGuardInteractionEvent,
  type MotionGuardTrace,
} from "../trace.js";
import { framesForTarget, type TargetFrame } from "./helpers.js";
import type { MotionGuardRule } from "./types.js";

function isMismatch(entry: TargetFrame, opacityThreshold: number): boolean {
  if (entry.target.state.phase !== "idle" || entry.target.state.declared === null) return false;
  const hidden = isVisuallyHidden(entry.target, opacityThreshold);
  return entry.target.state.declared === "open" ? hidden : !hidden;
}

type Interruption = Readonly<{
  first: MotionGuardInteractionEvent;
  second: MotionGuardInteractionEvent;
}>;

function interruptionsForTarget(
  trace: MotionGuardTrace,
  targetId: string,
  interruptionWindowMs: number,
): readonly Interruption[] {
  const changes = trace.interactions.filter(
    (event) => event.targetId === targetId && event.type === "state-change",
  );
  const interruptions: Interruption[] = [];
  for (let index = 1; index < changes.length; index += 1) {
    const first = changes[index - 1];
    const second = changes[index];
    if (
      first !== undefined &&
      second !== undefined &&
      first.stateValue !== null &&
      second.stateValue !== null &&
      first.stateValue !== second.stateValue &&
      second.atMs - first.atMs <= interruptionWindowMs
    ) {
      interruptions.push(Object.freeze({ first, second }));
    }
  }
  return Object.freeze(interruptions);
}

function relevantInterruption(
  interruptions: readonly Interruption[],
  mismatchStartMs: number,
  maximumObservationDelayMs: number,
): Interruption | null {
  for (let index = interruptions.length - 1; index >= 0; index -= 1) {
    const interruption = interruptions[index];
    if (interruption === undefined || interruption.second.atMs > mismatchStartMs) continue;
    return mismatchStartMs - interruption.second.atMs <= maximumObservationDelayMs
      ? interruption
      : null;
  }
  return null;
}

export const interruptedStateMismatchRule: MotionGuardRule = Object.freeze({
  id: "interrupted-state-mismatch",
  evaluate(trace, context): readonly MotionGuardFinding[] {
    const findings: MotionGuardFinding[] = [];

    for (const targetId of context.index.targetIds) {
      const interruptions = interruptionsForTarget(
        trace,
        targetId,
        context.options.stateMismatch.interruptionWindowMs,
      );
      if (interruptions.length === 0) continue;
      const entries = framesForTarget(context.index, targetId);
      let run: TargetFrame[] = [];

      const flush = (): void => {
        if (run.length < 2) {
          run = [];
          return;
        }
        const first = run[0];
        const last = run.at(-1);
        if (first === undefined || last === undefined) return;
        const durationMs = last.frame.atMs - first.frame.atMs;
        const interruption = relevantInterruption(
          interruptions,
          first.frame.atMs,
          context.options.stateMismatch.maximumObservationDelayMs,
        );
        if (durationMs < context.options.stateMismatch.minimumDurationMs || interruption === null) {
          run = [];
          return;
        }
        const declared = first.target.state.declared;
        findings.push(
          createFinding({
            scenarioId: trace.scenarioId,
            ruleId: "interrupted-state-mismatch",
            severity: "error",
            confidence: "high",
            targetId,
            title: "Interrupted state and visual state disagree",
            message: `After rapid state changes, the target remained visually ${declared === "open" ? "hidden" : "visible"} for ${durationMs.toFixed(0)} ms while its declared state was ${declared ?? "unknown"}.`,
            remediation:
              "Make interrupted transitions converge on the latest application state, and cancel or reverse stale enter/exit work when state changes again.",
            evidence: {
              startMs: first.frame.atMs,
              endMs: last.frame.atMs,
              frameIndexes: run.map((entry) => entry.frameIndex),
              interactionIds: [interruption.first.id, interruption.second.id],
              metrics: {
                durationMs,
                declaredState: declared ?? "unknown",
                stateChangeGapMs: interruption.second.atMs - interruption.first.atMs,
                minimumDurationMs: context.options.stateMismatch.minimumDurationMs,
              },
            },
          }),
        );
        run = [];
      };

      for (const entry of entries) {
        if (isMismatch(entry, context.options.stateMismatch.opacityThreshold)) run.push(entry);
        else flush();
      }
      flush();
    }

    return Object.freeze(findings);
  },
});
