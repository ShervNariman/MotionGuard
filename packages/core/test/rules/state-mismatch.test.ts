import { describe, expect, it } from "vitest";
import { evaluateMotionGuardTrace } from "../../src/index.js";
import { event, frame, target, trace } from "../helpers.js";

describe("interrupted state mismatch rule", () => {
  it("finds a closed target that remains visibly present", () => {
    const visibleClosed = target({ state: { declared: "closed", phase: "idle" } });
    const value = trace(
      [frame(40, [visibleClosed]), frame(140, [visibleClosed])],
      [
        event("open", 0, "state-change", { stateValue: "open" }),
        event("close", 40, "state-change", { stateValue: "closed" }),
      ],
    );
    const result = evaluateMotionGuardTrace(value);
    expect(result.findings[0]?.ruleId).toBe("interrupted-state-mismatch");
    expect(result.findings[0]?.evidence.metrics).toMatchObject({ durationMs: 100 });
  });

  it("does not flag active entering or exiting phases", () => {
    const exiting = target({ state: { declared: "closed", phase: "exiting" } });
    const value = trace(
      [frame(40, [exiting]), frame(140, [exiting])],
      [
        event("open", 0, "state-change", { stateValue: "open" }),
        event("close", 40, "state-change", { stateValue: "closed" }),
      ],
    );
    expect(evaluateMotionGuardTrace(value).findings).toHaveLength(0);
  });

  it("does not flag a mismatch shorter than the configured duration", () => {
    const visibleClosed = target({ state: { declared: "closed", phase: "idle" } });
    const value = trace(
      [frame(40, [visibleClosed]), frame(80, [visibleClosed])],
      [
        event("open", 0, "state-change", { stateValue: "open" }),
        event("close", 40, "state-change", { stateValue: "closed" }),
      ],
    );
    expect(evaluateMotionGuardTrace(value).findings).toHaveLength(0);
  });

  it("requires the rapid state events to reverse state", () => {
    const visibleClosed = target({ state: { declared: "closed", phase: "idle" } });
    const value = trace(
      [frame(40, [visibleClosed]), frame(140, [visibleClosed])],
      [
        event("open-1", 0, "state-change", { stateValue: "open" }),
        event("open-2", 40, "state-change", { stateValue: "open" }),
      ],
    );
    expect(evaluateMotionGuardTrace(value).findings).toHaveLength(0);
  });

  it("does not label a static mismatch as an interruption", () => {
    const visibleClosed = target({ state: { declared: "closed", phase: "idle" } });
    const value = trace([frame(0, [visibleClosed]), frame(100, [visibleClosed])]);
    expect(evaluateMotionGuardTrace(value).findings).toHaveLength(0);
  });
});
