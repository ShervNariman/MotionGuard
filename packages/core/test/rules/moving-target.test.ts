import { describe, expect, it } from "vitest";
import { evaluateMotionGuardTrace } from "../../src/index.js";
import { event, frame, target, trace } from "../helpers.js";

describe("moving interaction target rule", () => {
  it("finds a target that moves between pointer-down and pointer-up", () => {
    const value = trace(
      [
        frame(0, [target()]),
        frame(100, [target({ rect: { x: 30, y: 0, width: 100, height: 40 } })]),
      ],
      [
        event("down", 0, "pointer-down", { point: { x: 50, y: 20 } }),
        event("up", 100, "pointer-up", { point: { x: 20, y: 20 } }),
      ],
    );

    const result = evaluateMotionGuardTrace(value);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.ruleId).toBe("moving-interaction-target");
    expect(result.findings[0]?.evidence.metrics).toMatchObject({
      movedPx: 30,
      pointerEscaped: true,
    });
  });

  it("does not flag stable or sub-threshold movement", () => {
    const value = trace(
      [
        frame(0, [target()]),
        frame(100, [target({ rect: { x: 3, y: 0, width: 100, height: 40 } })]),
      ],
      [event("down", 0, "pointer-down"), event("up", 100, "pointer-up")],
    );
    expect(evaluateMotionGuardTrace(value).findings).toHaveLength(0);
  });

  it("does not blame a stable target when only the pointer moves outside", () => {
    const value = trace(
      [frame(0, [target()]), frame(100, [target()])],
      [
        event("down", 0, "pointer-down", { point: { x: 50, y: 20 } }),
        event("up", 100, "pointer-up", { point: { x: 500, y: 20 } }),
      ],
    );
    expect(evaluateMotionGuardTrace(value).findings).toHaveLength(0);
  });

  it("supports a stricter configured threshold", () => {
    const value = trace(
      [
        frame(0, [target()]),
        frame(100, [target({ rect: { x: 5, y: 0, width: 100, height: 40 } })]),
      ],
      [event("down", 0, "pointer-down"), event("up", 100, "pointer-up")],
    );
    const result = evaluateMotionGuardTrace(value, {
      options: { movingTarget: { minimumDistancePx: 4 } },
    });
    expect(result.findings[0]?.ruleId).toBe("moving-interaction-target");
  });
});
