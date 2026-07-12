import { describe, expect, it } from "vitest";
import { defineMotionGuardTrace, findTargetAtOrBefore } from "../src/index.js";
import { event, frame, target, trace } from "./helpers.js";

describe("defineMotionGuardTrace", () => {
  it("deeply freezes a valid bounded trace", () => {
    const value = trace(
      [frame(0, [target()]), frame(16, [target({ rect: { x: 1, y: 0, width: 100, height: 40 } })])],
      [event("down", 2, "pointer-down", { point: { x: 20, y: 20 } })],
    );

    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.frames)).toBe(true);
    expect(Object.isFrozen(value.frames[0]?.targets[0]?.rect)).toBe(true);
    expect(Object.isFrozen(value.interactions[0]?.point)).toBe(true);
  });

  it.each([
    [
      "non-increasing frame timestamps",
      () => trace([frame(10, [target()]), frame(10, [target()])]),
    ],
    ["duplicate target ids", () => trace([frame(0, [target(), target({ selector: "#other" })])])],
    [
      "invalid opacity",
      () => trace([frame(0, [target({ visual: { ...target().visual, opacity: 2 } })])]),
    ],
    [
      "out-of-order interactions",
      () =>
        trace([frame(0, [target()])], [event("a", 5, "click"), event("b", 4, "click")], {
          durationMs: 5,
        }),
    ],
    [
      "unsupported schema",
      () =>
        defineMotionGuardTrace({
          schemaVersion: "0.2" as "0.1",
          scenarioId: "test",
          reducedMotion: "reduce",
          durationMs: 0,
          frames: [frame(0, [target()])],
          interactions: [],
        }),
    ],
  ])("rejects %s", (_name, create) => {
    expect(create).toThrow();
  });

  it("rejects unstable identity metadata for the same target id", () => {
    expect(() =>
      trace([
        frame(0, [target({ motionIntent: "unknown" })]),
        frame(16, [target({ motionIntent: "non-essential" })]),
      ]),
    ).toThrow("identity metadata changed");
  });

  it("requires a value for state-change events", () => {
    expect(() =>
      trace([frame(0, [target()])], [event("bad-state", 0, "state-change", { stateValue: null })]),
    ).toThrow("stateValue is required");
  });

  it("does not reuse a stale target sample when the latest frame omits it", () => {
    const value = trace([frame(0, [target()]), frame(16, [])]);
    expect(findTargetAtOrBefore(value, "target", 16)).toBeNull();
  });

  it("enforces caller-provided trace limits", () => {
    expect(() => trace([frame(0, [target()]), frame(1, [target()])])).not.toThrow();
    expect(() =>
      defineMotionGuardTrace(
        {
          schemaVersion: "0.1",
          scenarioId: "test",
          reducedMotion: "reduce",
          durationMs: 1,
          frames: [frame(0, [target()]), frame(1, [target()])],
          interactions: [],
        },
        { maxFrames: 1 },
      ),
    ).toThrow("frames must contain");
  });
});
