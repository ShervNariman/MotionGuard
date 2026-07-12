import type { MotionGuardConfig, MotionGuardScenario } from "./types.js";

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive integer.`);
  }
}

function validateScenario(scenario: MotionGuardScenario, index: number): void {
  if (scenario.id.trim().length === 0) {
    throw new TypeError(`scenarios[${String(index)}].id must not be empty.`);
  }
  if (scenario.name.trim().length === 0) {
    throw new TypeError(`scenarios[${String(index)}].name must not be empty.`);
  }
  if (scenario.interaction.target.trim().length === 0) {
    throw new TypeError(`scenarios[${String(index)}].interaction.target must not be empty.`);
  }
  assertPositiveInteger(scenario.viewport.width, `scenarios[${String(index)}].viewport.width`);
  assertPositiveInteger(scenario.viewport.height, `scenarios[${String(index)}].viewport.height`);
}

export function defineMotionGuardConfig(config: MotionGuardConfig): MotionGuardConfig {
  const url = new URL(config.baseUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("baseUrl must use http or https.");
  }
  if (config.scenarios.length === 0) {
    throw new TypeError("At least one scenario is required.");
  }

  const ids = new Set<string>();
  config.scenarios.forEach((scenario, index) => {
    validateScenario(scenario, index);
    if (ids.has(scenario.id)) {
      throw new TypeError(`Scenario id must be unique: ${scenario.id}`);
    }
    ids.add(scenario.id);
  });

  return Object.freeze({
    baseUrl: url.toString(),
    scenarios: Object.freeze(config.scenarios.map((scenario) => Object.freeze(scenario))),
  });
}
