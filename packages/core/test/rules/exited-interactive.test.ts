import { describe, expect, it } from "vitest";
import { evaluateMotionGuardTrace } from "../../src/index.js";
import { frame, target, trace } from "../helpers.js";

describe("exited-but-interactive rule", () => {
  it("finds an opacity-hidden target that remains pointer active and focusable", () => {
    const hidden = target({
      visual: { ...target().visual, opacity: 0, pointerEvents: "auto" },
      accessibility: { ...target().accessibility, focusable: true },
    });
    const value = trace([frame(0, [hidden]), frame(75, [hidden])]);
    const result = evaluateMotionGuardTrace(value);
    expect(result.findings[0]?.ruleId).toBe("exited-but-interactive");
    expect(result.findings[0]?.evidence.metrics).toMatchObject({ pointerActive: true });
  });

  it("does not flag a hidden target that disables focus and pointer interaction", () => {
    const hidden = target({
      visual: { ...target().visual, opacity: 0, pointerEvents: "none" },
      accessibility: { ...target().accessibility, focusable: false },
    });
    const value = trace([frame(0, [hidden]), frame(75, [hidden])]);
    expect(evaluateMotionGuardTrace(value).findings).toHaveLength(0);
  });

  it("does not treat a disconnected target as interactive", () => {
    const removed = target({
      connected: false,
      accessibility: { ...target().accessibility, focusable: true },
    });
    const value = trace([frame(0, [removed]), frame(75, [removed])]);
    expect(evaluateMotionGuardTrace(value).findings).toHaveLength(0);
  });
});
