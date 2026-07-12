import { MotionGuardPlaywrightError } from "./errors.js";
import type {
  MotionGuardPlaywrightScenario,
  MotionGuardPlaywrightTarget,
  MotionGuardStateMapping,
} from "./types.js";

export const DEFAULT_PLAYWRIGHT_LIMITS = Object.freeze({
  sampleIntervalMs: 16,
  settleMs: 180,
  timeoutMs: 10_000,
  navigationTimeoutMs: 10_000,
  maxTargets: 100,
  maxStringLength: 512,
  maxDurationMs: 300_000,
  maxFrames: 10_000,
});

export type NormalizedPlaywrightScenario = Readonly<{
  id: string;
  url: string;
  viewport: Readonly<{ width: number; height: number; deviceScaleFactor?: number }>;
  reducedMotion: "reduce" | "no-preference";
  targets: readonly MotionGuardPlaywrightTarget[];
  allowedOrigins: readonly string[];
  sampleIntervalMs: number;
  settleMs: number;
  timeoutMs: number;
  navigationTimeoutMs: number;
}>;

function fail(message: string): never {
  throw new MotionGuardPlaywrightError("INVALID_CONFIGURATION", message);
}

function stringValue(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > DEFAULT_PLAYWRIGHT_LIMITS.maxStringLength
  ) {
    fail(
      `${label} must contain 1–${String(DEFAULT_PLAYWRIGHT_LIMITS.maxStringLength)} characters.`,
    );
  }
  return value;
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) fail(`${label} must be a positive integer.`);
  return value;
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) fail(`${label} must be a non-negative integer.`);
  return value;
}

function freezeStrings(values: readonly string[] | undefined, label: string): readonly string[] {
  return Object.freeze(
    (values ?? []).map((value, index) =>
      stringValue(value, `${label}[${String(index)}]`).toLowerCase(),
    ),
  );
}

function freezeState(state: MotionGuardStateMapping): MotionGuardStateMapping {
  return Object.freeze({
    attribute: stringValue(state.attribute, "target.state.attribute"),
    openValues: freezeStrings(state.openValues, "target.state.openValues"),
    closedValues: freezeStrings(state.closedValues, "target.state.closedValues"),
    enteringValues: freezeStrings(state.enteringValues, "target.state.enteringValues"),
    exitingValues: freezeStrings(state.exitingValues, "target.state.exitingValues"),
  });
}

function freezeTarget(
  target: MotionGuardPlaywrightTarget,
  index: number,
): MotionGuardPlaywrightTarget {
  if (!(["essential", "non-essential", "unknown"] as const).includes(target.motionIntent)) {
    fail(`targets[${String(index)}].motionIntent is unsupported.`);
  }
  const base = {
    id: stringValue(target.id, `targets[${String(index)}].id`),
    selector: stringValue(target.selector, `targets[${String(index)}].selector`),
    motionIntent: target.motionIntent,
  };
  if (target.state === undefined) return Object.freeze(base);
  return Object.freeze({ ...base, state: freezeState(target.state) });
}

function isLoopback(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".localhost")
  );
}

function normalizeOrigins(values: readonly string[] | undefined): readonly string[] {
  const origins = (values ?? []).map((value, index) => {
    const url = new URL(stringValue(value, `allowedOrigins[${String(index)}]`));
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      fail(`allowedOrigins[${String(index)}] must use http or https.`);
    }
    return url.origin;
  });
  return Object.freeze([...new Set(origins)].sort());
}

export function normalizeScenario(
  scenario: MotionGuardPlaywrightScenario,
): NormalizedPlaywrightScenario {
  const url = new URL(stringValue(scenario.url, "scenario.url"));
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    fail("scenario.url must use http or https.");
  }
  if (scenario.reducedMotion !== "reduce" && scenario.reducedMotion !== "no-preference") {
    fail("scenario.reducedMotion is unsupported.");
  }
  const allowedOrigins = normalizeOrigins(scenario.allowedOrigins);
  if (!isLoopback(url.hostname) && !allowedOrigins.includes(url.origin)) {
    throw new MotionGuardPlaywrightError(
      "REMOTE_ORIGIN_NOT_ALLOWED",
      `Remote origin ${url.origin} must be explicitly allowlisted.`,
    );
  }
  if (
    scenario.targets.length === 0 ||
    scenario.targets.length > DEFAULT_PLAYWRIGHT_LIMITS.maxTargets
  ) {
    fail(
      `scenario.targets must contain 1–${String(DEFAULT_PLAYWRIGHT_LIMITS.maxTargets)} entries.`,
    );
  }
  const targets = scenario.targets.map(freezeTarget);
  const ids = new Set<string>();
  for (const target of targets) {
    if (ids.has(target.id)) fail(`Target id must be unique: ${target.id}`);
    ids.add(target.id);
  }

  const deviceScaleFactor = scenario.viewport.deviceScaleFactor;
  if (
    deviceScaleFactor !== undefined &&
    (!Number.isFinite(deviceScaleFactor) || deviceScaleFactor <= 0)
  ) {
    fail("scenario.viewport.deviceScaleFactor must be positive and finite.");
  }
  const sampleIntervalMs = positiveInteger(
    scenario.sampleIntervalMs ?? DEFAULT_PLAYWRIGHT_LIMITS.sampleIntervalMs,
    "scenario.sampleIntervalMs",
  );
  if (sampleIntervalMs < 4) fail("scenario.sampleIntervalMs must be at least 4 ms.");
  const settleMs = nonNegativeInteger(
    scenario.settleMs ?? DEFAULT_PLAYWRIGHT_LIMITS.settleMs,
    "scenario.settleMs",
  );
  const timeoutMs = positiveInteger(
    scenario.timeoutMs ?? DEFAULT_PLAYWRIGHT_LIMITS.timeoutMs,
    "scenario.timeoutMs",
  );
  if (timeoutMs > DEFAULT_PLAYWRIGHT_LIMITS.maxDurationMs) {
    fail(
      `scenario.timeoutMs must not exceed ${String(DEFAULT_PLAYWRIGHT_LIMITS.maxDurationMs)} ms.`,
    );
  }
  if (settleMs >= timeoutMs) fail("scenario.settleMs must be smaller than scenario.timeoutMs.");
  if (Math.ceil(timeoutMs / sampleIntervalMs) + 2 > DEFAULT_PLAYWRIGHT_LIMITS.maxFrames) {
    fail("scenario timeout and sample interval would exceed the maximum frame count.");
  }

  return Object.freeze({
    id: stringValue(scenario.id, "scenario.id"),
    url: url.toString(),
    viewport: Object.freeze({
      width: positiveInteger(scenario.viewport.width, "scenario.viewport.width"),
      height: positiveInteger(scenario.viewport.height, "scenario.viewport.height"),
      ...(deviceScaleFactor === undefined ? {} : { deviceScaleFactor }),
    }),
    reducedMotion: scenario.reducedMotion,
    targets: Object.freeze(targets),
    allowedOrigins,
    sampleIntervalMs,
    settleMs,
    timeoutMs,
    navigationTimeoutMs: positiveInteger(
      scenario.navigationTimeoutMs ?? DEFAULT_PLAYWRIGHT_LIMITS.navigationTimeoutMs,
      "scenario.navigationTimeoutMs",
    ),
  });
}
