import { describe, expect, it } from "vitest";
import { evaluateMotionGuardTrace } from "../../src/index.js";
import { frame, target, trace } from "../helpers.js";

describe("reduced motion mismatch rule", () => {
  it("finds large non-essential movement under reduced motion", () => {
    const value = trace(
      [
        frame(0, [target({ motionIntent: "non-essential" })]),
        frame(100, [
          target({ motionIntent: "non-essential", rect: { x: 40, y: 0, width: 100, height: 40 } }),
        ]),
      ],
      [],
      { reducedMotion: "reduce" },
    );
    const result = evaluateMotionGuardTrace(value);
    expect(result.findings[0]?.ruleId).toBe("reduced-motion-mismatch");
    expect(result.findings[0]?.severity).toBe("warning");
  });

  it.each(["essential", "unknown"] as const)("does not judge %s motion", (motionIntent) => {
    const value = trace(
      [
        frame(0, [target({ motionIntent })]),
        frame(100, [target({ motionIntent, rect: { x: 100, y: 0, width: 100, height: 40 } })]),
      ],
      [],
      { reducedMotion: "reduce" },
    );
    expect(evaluateMotionGuardTrace(value).findings).toHaveLength(0);
  });

  it("does not run when reduced motion is not enabled", () => {
    const value = trace([
      frame(0, [target({ motionIntent: "non-essential" })]),
      frame(100, [
        target({ motionIntent: "non-essential", rect: { x: 100, y: 0, width: 100, height: 40 } }),
      ]),
    ]);
    expect(evaluateMotionGuardTrace(value).findings).toHaveLength(0);
  });
});
