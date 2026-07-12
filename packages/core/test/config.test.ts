import { describe, expect, it } from "vitest";
import { defineMotionGuardConfig } from "../src/index.js";

const validScenario = {
  id: "dialog-interruption",
  name: "Dialog interruption",
  interaction: { kind: "click" as const, target: "[data-open-dialog]" },
  viewport: { width: 1280, height: 720 },
  reducedMotion: "no-preference" as const,
};

describe("defineMotionGuardConfig", () => {
  it("normalizes and freezes a valid config", () => {
    const config = defineMotionGuardConfig({
      baseUrl: "http://localhost:3000",
      scenarios: [validScenario],
    });

    expect(config.baseUrl).toBe("http://localhost:3000/");
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.scenarios)).toBe(true);
    expect(Object.isFrozen(config.scenarios[0])).toBe(true);
    expect(Object.isFrozen(config.scenarios[0]?.interaction)).toBe(true);
    expect(Object.isFrozen(config.scenarios[0]?.viewport)).toBe(true);
  });

  it.each([
    ["unsupported protocol", { baseUrl: "file:///tmp/demo", scenarios: [validScenario] }],
    ["empty scenarios", { baseUrl: "https://example.com", scenarios: [] }],
    [
      "duplicate ids",
      { baseUrl: "https://example.com", scenarios: [validScenario, validScenario] },
    ],
  ])("rejects %s", (_name, config) => {
    expect(() => defineMotionGuardConfig(config)).toThrow(TypeError);
  });

  it.each([
    ["interaction kind", { ...validScenario, interaction: { kind: "drag", target: "#target" } }],
    ["reduced motion", { ...validScenario, reducedMotion: "sometimes" }],
    [
      "device scale factor",
      { ...validScenario, viewport: { width: 1280, height: 720, deviceScaleFactor: 0 } },
    ],
  ])("rejects an invalid %s", (_name, scenario) => {
    expect(() =>
      defineMotionGuardConfig({
        baseUrl: "https://example.com",
        scenarios: [scenario as typeof validScenario],
      }),
    ).toThrow(TypeError);
  });

  it("rejects invalid viewport dimensions", () => {
    expect(() =>
      defineMotionGuardConfig({
        baseUrl: "https://example.com",
        scenarios: [{ ...validScenario, viewport: { width: 0, height: 720 } }],
      }),
    ).toThrow("positive integer");
  });
});
