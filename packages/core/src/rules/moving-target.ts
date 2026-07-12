import { createFinding, type MotionGuardFinding } from "../findings.js";
import {
  distance,
  findTargetAtOrBefore,
  pointInsideRect,
  rectCenter,
  type MotionGuardInteractionEvent,
} from "../trace.js";
import type { MotionGuardRule } from "./types.js";

function nextPointerUp(
  interactions: readonly MotionGuardInteractionEvent[],
  startIndex: number,
  targetId: string,
): MotionGuardInteractionEvent | null {
  for (let index = startIndex + 1; index < interactions.length; index += 1) {
    const event = interactions[index];
    if (event?.type === "pointer-up" && event.targetId === targetId) return event;
    if (event?.type === "pointer-down" && event.targetId === targetId) return null;
  }
  return null;
}

export const movingInteractionTargetRule: MotionGuardRule = Object.freeze({
  id: "moving-interaction-target",
  evaluate(trace, context): readonly MotionGuardFinding[] {
    const findings: MotionGuardFinding[] = [];

    trace.interactions.forEach((down, index) => {
      if (down.type !== "pointer-down") return;
      const up = nextPointerUp(trace.interactions, index, down.targetId);
      if (up === null) return;
      const downState = findTargetAtOrBefore(trace, down.targetId, down.atMs);
      const upState = findTargetAtOrBefore(trace, up.targetId, up.atMs);
      if (downState === null || upState === null) return;
      if (!downState.target.connected || !upState.target.connected) return;

      const movedPx = distance(rectCenter(downState.target.rect), rectCenter(upState.target.rect));
      const pointerEscaped = up.point !== null && !pointInsideRect(up.point, upState.target.rect);
      const pointerMovedPx =
        down.point !== null && up.point !== null ? distance(down.point, up.point) : null;
      if (movedPx < context.options.movingTarget.minimumDistancePx) return;

      findings.push(
        createFinding({
          scenarioId: trace.scenarioId,
          ruleId: "moving-interaction-target",
          severity: "error",
          confidence: "high",
          targetId: down.targetId,
          title: "Interaction target moved during activation",
          message: `The target moved ${movedPx.toFixed(1)} px between pointer-down and pointer-up${pointerEscaped ? ", leaving the release point outside the target" : ""}.`,
          remediation:
            "Keep the active target geometrically stable until pointer-up, or preserve a forgiving hit area that covers the original activation region.",
          evidence: {
            startMs: down.atMs,
            endMs: up.atMs,
            frameIndexes: [downState.frameIndex, upState.frameIndex],
            interactionIds: [down.id, up.id],
            metrics: {
              movedPx: Number(movedPx.toFixed(3)),
              pointerEscaped,
              pointerMovedPx:
                pointerMovedPx === null ? "unknown" : Number(pointerMovedPx.toFixed(3)),
              minimumDistancePx: context.options.movingTarget.minimumDistancePx,
            },
          },
        }),
      );
    });

    return Object.freeze(findings);
  },
});
