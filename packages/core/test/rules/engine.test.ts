import { describe, expect, it } from "vitest";
import { defineRuleOptions, evaluateMotionGuardTrace } from "../../src/index.js";
import { event, frame, target, trace } from "../helpers.js";

describe("rule engine", () => {
  it("returns a frozen passing evaluation when no finding exists", () => {
    const result = evaluateMotionGuardTrace(trace([frame(0, [target()])]));
    expect(result).toEqual({ passed: true, findings: [] });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.findings)).toBe(true);
  });

  it("orders findings deterministically", () => {
    const hiddenInteractive = target({
      id: "b",
      visual: { ...target().visual, opacity: 0, pointerEvents: "auto" },
      accessibility: { ...target().accessibility, focusable: true },
    });
    const visibleClosed = target({ id: "a", state: { declared: "closed", phase: "idle" } });
    const value = trace(
      [
        frame(40, [hiddenInteractive, visibleClosed]),
        frame(140, [hiddenInteractive, visibleClosed]),
      ],
      [
        event("a-open", 0, "state-change", { targetId: "a", stateValue: "open" }),
        event("a-close", 40, "state-change", { targetId: "a", stateValue: "closed" }),
      ],
    );
    const result = evaluateMotionGuardTrace(value);
    expect(result.findings.map((finding) => finding.ruleId)).toEqual([
      "exited-but-interactive",
      "interrupted-state-mismatch",
    ]);
  });

  it("returns byte-identical findings across five repeated evaluations", () => {
    const moving = trace(
      [
        frame(0, [target()]),
        frame(100, [target({ rect: { x: 20, y: 0, width: 100, height: 40 } })]),
      ],
      [event("down", 0, "pointer-down"), event("up", 100, "pointer-up")],
    );
    const outputs = Array.from({ length: 5 }, () =>
      JSON.stringify(evaluateMotionGuardTrace(moving)),
    );
    expect(new Set(outputs)).toHaveLength(1);
  });

  it("rejects invalid rule thresholds", () => {
    expect(() => defineRuleOptions({ movingTarget: { minimumDistancePx: 0 } })).toThrow();
    expect(() => defineRuleOptions({ stateMismatch: { opacityThreshold: 2 } })).toThrow();
  });
});
