import { describe, expect, it } from "vitest";
import { normalizeScenario } from "../../src/config.js";
import { MotionGuardPlaywrightError } from "../../src/errors.js";

const target = {
  id: "dialog",
  selector: "[data-dialog]",
  motionIntent: "non-essential" as const,
};

function scenario(overrides: Record<string, unknown> = {}) {
  return {
    id: "dialog-reversal",
    url: "http://127.0.0.1:3000/demo",
    viewport: { width: 1280, height: 720 },
    reducedMotion: "no-preference" as const,
    targets: [target],
    ...overrides,
  };
}

describe("normalizeScenario", () => {
  it("accepts and deeply freezes a bounded loopback scenario", () => {
    const result = normalizeScenario(scenario());
    expect(result.url).toBe("http://127.0.0.1:3000/demo");
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.viewport)).toBe(true);
    expect(Object.isFrozen(result.targets)).toBe(true);
    expect(Object.isFrozen(result.targets[0])).toBe(true);
  });

  it("requires an exact allowlist entry for remote origins", () => {
    expect(() => normalizeScenario(scenario({ url: "https://example.com/demo" }))).toThrowError(
      expect.objectContaining<Partial<MotionGuardPlaywrightError>>({
        code: "REMOTE_ORIGIN_NOT_ALLOWED",
      }),
    );

    expect(
      normalizeScenario(
        scenario({
          url: "https://example.com/demo",
          allowedOrigins: ["https://example.com/path-is-ignored"],
        }),
      ).url,
    ).toBe("https://example.com/demo");
  });

  it.each([
    ["duplicate target IDs", { targets: [target, target] }],
    ["too-fast sampling", { sampleIntervalMs: 1 }],
    ["settle beyond timeout", { settleMs: 500, timeoutMs: 500 }],
    ["unbounded duration", { timeoutMs: 300_001 }],
    ["unsupported URL", { url: "file:///tmp/demo.html" }],
    ["invalid viewport", { viewport: { width: 0, height: 720 } }],
  ])("rejects %s", (_name, overrides) => {
    expect(() => normalizeScenario(scenario(overrides))).toThrow(MotionGuardPlaywrightError);
  });

  it("normalizes custom state values for case-insensitive comparison", () => {
    const result = normalizeScenario(
      scenario({
        targets: [
          {
            ...target,
            state: {
              attribute: "data-state",
              openValues: ["OPEN"],
              closedValues: ["CLOSED"],
            },
          },
        ],
      }),
    );
    expect(result.targets[0]?.state?.openValues).toEqual(["open"]);
    expect(result.targets[0]?.state?.closedValues).toEqual(["closed"]);
  });
});
