import { createFinding, type MotionGuardFinding } from "../findings.js";
import { distance, rectCenter } from "../trace.js";
import { framesForTarget } from "./helpers.js";
import type { MotionGuardRule } from "./types.js";

export const reducedMotionMismatchRule: MotionGuardRule = Object.freeze({
  id: "reduced-motion-mismatch",
  evaluate(trace, context): readonly MotionGuardFinding[] {
    if (trace.reducedMotion !== "reduce") return Object.freeze([]);
    const findings: MotionGuardFinding[] = [];

    for (const targetId of context.index.targetIds) {
      const entries = framesForTarget(context.index, targetId).filter(
        (entry) => entry.target.connected && entry.target.motionIntent === "non-essential",
      );
      const first = entries[0];
      if (first === undefined || entries.length < 2) continue;

      const origin = rectCenter(first.target.rect);
      let maximumDistancePx = 0;
      let maximumEntry = first;
      for (const entry of entries.slice(1)) {
        const moved = distance(origin, rectCenter(entry.target.rect));
        if (moved > maximumDistancePx) {
          maximumDistancePx = moved;
          maximumEntry = entry;
        }
      }
      if (maximumDistancePx <= context.options.reducedMotion.maximumDistancePx) continue;

      findings.push(
        createFinding({
          scenarioId: trace.scenarioId,
          ruleId: "reduced-motion-mismatch",
          severity: "warning",
          confidence: "high",
          targetId,
          title: "Non-essential spatial motion remains under reduced motion",
          message: `The target moved ${maximumDistancePx.toFixed(1)} px while reduced motion was enabled.`,
          remediation:
            "Replace non-essential spatial movement with an immediate state change or a restrained opacity transition when reduced motion is requested.",
          evidence: {
            startMs: first.frame.atMs,
            endMs: maximumEntry.frame.atMs,
            frameIndexes: [first.frameIndex, maximumEntry.frameIndex],
            interactionIds: [],
            metrics: {
              maximumDistancePx: Number(maximumDistancePx.toFixed(3)),
              allowedDistancePx: context.options.reducedMotion.maximumDistancePx,
              motionIntent: "non-essential",
            },
          },
        }),
      );
    }

    return Object.freeze(findings);
  },
});
