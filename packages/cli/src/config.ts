import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { MotionGuardPlaywrightScenario } from "@motionguard/playwright";

const MAX_SCENARIOS = 100;
const MAX_ACTIONS = 100;
const MAX_STRING = 512;
const MAX_WAIT_MS = 60_000;

export type MotionGuardCliAction =
  | Readonly<{ type: "click"; selector: string }>
  | Readonly<{ type: "hover"; selector: string }>
  | Readonly<{ type: "press"; selector: string; key: string }>
  | Readonly<{ type: "wait"; ms: number }>;

export type MotionGuardCliScenario = MotionGuardPlaywrightScenario &
  Readonly<{ actions?: readonly MotionGuardCliAction[] }>;

export type MotionGuardCliConfig = Readonly<{
  schemaVersion: "0.1";
  outputDir: string;
  includeTrace: boolean;
  scenarios: readonly MotionGuardCliScenario[];
}>;

function fail(message: string): never {
  throw new TypeError(message);
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > MAX_STRING) {
    fail(`${label} must contain 1–${MAX_STRING} characters.`);
  }
  return value;
}

function integerValue(value: unknown, label: string, minimum = 0, maximum?: number): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    (maximum !== undefined && value > maximum)
  ) {
    const upperBound = maximum === undefined ? "" : ` and at most ${maximum}`;
    fail(`${label} must be an integer greater than or equal to ${minimum}${upperBound}.`);
  }
  return value;
}

function parseActions(value: unknown, label: string): readonly MotionGuardCliAction[] {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value) || value.length > MAX_ACTIONS) {
    fail(`${label} must be an array with at most ${MAX_ACTIONS} actions.`);
  }
  return Object.freeze(
    value.map((raw, index) => {
      const action = objectValue(raw, `${label}[${index}]`);
      const type = stringValue(action.type, `${label}[${index}].type`);
      if (type === "wait") {
        return Object.freeze({
          type,
          ms: integerValue(action.ms, `${label}[${index}].ms`, 1, MAX_WAIT_MS),
        });
      }
      if (type === "click" || type === "hover") {
        return Object.freeze({
          type,
          selector: stringValue(action.selector, `${label}[${index}].selector`),
        });
      }
      if (type === "press") {
        return Object.freeze({
          type,
          selector: stringValue(action.selector, `${label}[${index}].selector`),
          key: stringValue(action.key, `${label}[${index}].key`),
        });
      }
      return fail(`${label}[${index}].type is unsupported.`);
    }),
  );
}

export function parseCliConfig(value: unknown): MotionGuardCliConfig {
  const root = objectValue(value, "config");
  if (root.schemaVersion !== "0.1") fail('config.schemaVersion must be "0.1".');
  if (
    !Array.isArray(root.scenarios) ||
    root.scenarios.length === 0 ||
    root.scenarios.length > MAX_SCENARIOS
  ) {
    fail(`config.scenarios must contain 1–${MAX_SCENARIOS} entries.`);
  }
  const scenarios = Object.freeze(
    root.scenarios.map((raw, index) => {
      const scenario = objectValue(raw, `config.scenarios[${index}]`);
      const actions = parseActions(scenario.actions, `config.scenarios[${index}].actions`);
      return Object.freeze({ ...scenario, actions }) as MotionGuardCliScenario;
    }),
  );
  return Object.freeze({
    schemaVersion: "0.1",
    outputDir:
      root.outputDir === undefined ? ".motionguard" : stringValue(root.outputDir, "config.outputDir"),
    includeTrace: root.includeTrace === true,
    scenarios,
  });
}

export async function loadCliConfig(path: string): Promise<MotionGuardCliConfig> {
  const absolute = resolve(path);
  const text = await readFile(absolute, "utf8");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new TypeError(`Could not parse JSON config ${absolute}.`, { cause: error });
  }
  return parseCliConfig(value);
}

export const DEFAULT_CONFIG = `{
  "schemaVersion": "0.1",
  "outputDir": ".motionguard",
  "includeTrace": false,
  "scenarios": [
    {
      "id": "dialog-reversal",
      "url": "http://127.0.0.1:3000/demo",
      "viewport": { "width": 1280, "height": 720 },
      "reducedMotion": "no-preference",
      "targets": [
        { "id": "dialog", "selector": "[data-dialog]", "motionIntent": "non-essential" }
      ],
      "actions": [
        { "type": "click", "selector": "[data-open]" },
        { "type": "wait", "ms": 40 },
        { "type": "click", "selector": "[data-close]" }
      ]
    }
  ]
}\n`;
