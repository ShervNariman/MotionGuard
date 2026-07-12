export const MOTIONGUARD_TRACE_SCHEMA_VERSION = "0.1" as const;

export type MotionGuardPoint = Readonly<{
  x: number;
  y: number;
}>;

export type MotionGuardRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type MotionGuardVisualSnapshot = Readonly<{
  display: string;
  visibility: string;
  opacity: number;
  pointerEvents: string;
  transform: string;
}>;

export type MotionGuardAccessibilitySnapshot = Readonly<{
  focusable: boolean;
  focused: boolean;
  ariaHidden: boolean | null;
  ariaExpanded: boolean | null;
}>;

export type MotionGuardStateSnapshot = Readonly<{
  declared: "open" | "closed" | null;
  phase: "idle" | "entering" | "exiting";
}>;

export type MotionGuardTargetSnapshot = Readonly<{
  id: string;
  selector: string | null;
  connected: boolean;
  rect: MotionGuardRect;
  visual: MotionGuardVisualSnapshot;
  accessibility: MotionGuardAccessibilitySnapshot;
  state: MotionGuardStateSnapshot;
  motionIntent: "essential" | "non-essential" | "unknown";
}>;

export type MotionGuardFrame = Readonly<{
  atMs: number;
  targets: readonly MotionGuardTargetSnapshot[];
}>;

export type MotionGuardInteractionEvent = Readonly<{
  id: string;
  atMs: number;
  type: "pointer-down" | "pointer-up" | "click" | "key-down" | "state-change";
  targetId: string;
  point: MotionGuardPoint | null;
  key: string | null;
  stateValue: "open" | "closed" | null;
}>;

export type MotionGuardTrace = Readonly<{
  schemaVersion: typeof MOTIONGUARD_TRACE_SCHEMA_VERSION;
  scenarioId: string;
  reducedMotion: "reduce" | "no-preference";
  durationMs: number;
  frames: readonly MotionGuardFrame[];
  interactions: readonly MotionGuardInteractionEvent[];
}>;

export type MotionGuardTraceLimits = Readonly<{
  maxDurationMs: number;
  maxFrames: number;
  maxTargetsPerFrame: number;
  maxInteractions: number;
  maxStringLength: number;
}>;

export const DEFAULT_TRACE_LIMITS: MotionGuardTraceLimits = Object.freeze({
  maxDurationMs: 300_000,
  maxFrames: 10_000,
  maxTargetsPerFrame: 1_000,
  maxInteractions: 2_000,
  maxStringLength: 512,
});

const interactionTypes = new Set<MotionGuardInteractionEvent["type"]>([
  "pointer-down",
  "pointer-up",
  "click",
  "key-down",
  "state-change",
]);
const phases = new Set<MotionGuardStateSnapshot["phase"]>(["idle", "entering", "exiting"]);
const declaredStates = new Set<MotionGuardStateSnapshot["declared"]>(["open", "closed", null]);
const motionIntents = new Set<MotionGuardTargetSnapshot["motionIntent"]>([
  "essential",
  "non-essential",
  "unknown",
]);

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be finite.`);
  }
}

function assertNonNegativeFinite(value: number, label: string): void {
  assertFinite(value, label);
  if (value < 0) {
    throw new TypeError(`${label} must be non-negative.`);
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive integer.`);
  }
}

function assertString(
  value: unknown,
  label: string,
  maxLength: number,
  allowEmpty = false,
): asserts value is string {
  if (
    typeof value !== "string" ||
    (!allowEmpty && value.trim().length === 0) ||
    value.length > maxLength
  ) {
    throw new TypeError(
      `${label} must be ${allowEmpty ? "at most" : "between 1 and"} ${String(maxLength)} characters.`,
    );
  }
}

function assertBoolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new TypeError(`${label} must be a boolean.`);
  }
}

function assertNullableBoolean(value: unknown, label: string): asserts value is boolean | null {
  if (value !== null && typeof value !== "boolean") {
    throw new TypeError(`${label} must be a boolean or null.`);
  }
}

function validateLimits(limits: MotionGuardTraceLimits): void {
  assertPositiveInteger(limits.maxDurationMs, "limits.maxDurationMs");
  assertPositiveInteger(limits.maxFrames, "limits.maxFrames");
  assertPositiveInteger(limits.maxTargetsPerFrame, "limits.maxTargetsPerFrame");
  assertPositiveInteger(limits.maxInteractions, "limits.maxInteractions");
  assertPositiveInteger(limits.maxStringLength, "limits.maxStringLength");
}

function freezePoint(point: MotionGuardPoint | null, label: string): MotionGuardPoint | null {
  if (point === null) return null;
  assertFinite(point.x, `${label}.x`);
  assertFinite(point.y, `${label}.y`);
  return Object.freeze({ x: point.x, y: point.y });
}

function freezeRect(rect: MotionGuardRect, label: string): MotionGuardRect {
  assertFinite(rect.x, `${label}.x`);
  assertFinite(rect.y, `${label}.y`);
  assertNonNegativeFinite(rect.width, `${label}.width`);
  assertNonNegativeFinite(rect.height, `${label}.height`);
  return Object.freeze({ ...rect });
}

function freezeTarget(
  target: MotionGuardTargetSnapshot,
  label: string,
  maxStringLength: number,
): MotionGuardTargetSnapshot {
  assertString(target.id, `${label}.id`, maxStringLength);
  assertBoolean(target.connected, `${label}.connected`);
  if (target.selector !== null) {
    assertString(target.selector, `${label}.selector`, maxStringLength);
  }
  assertString(target.visual.display, `${label}.visual.display`, maxStringLength, true);
  assertString(target.visual.visibility, `${label}.visual.visibility`, maxStringLength, true);
  assertString(target.visual.pointerEvents, `${label}.visual.pointerEvents`, maxStringLength, true);
  assertString(target.visual.transform, `${label}.visual.transform`, maxStringLength, true);
  assertFinite(target.visual.opacity, `${label}.visual.opacity`);
  if (target.visual.opacity < 0 || target.visual.opacity > 1) {
    throw new TypeError(`${label}.visual.opacity must be between 0 and 1.`);
  }
  assertBoolean(target.accessibility.focusable, `${label}.accessibility.focusable`);
  assertBoolean(target.accessibility.focused, `${label}.accessibility.focused`);
  assertNullableBoolean(target.accessibility.ariaHidden, `${label}.accessibility.ariaHidden`);
  assertNullableBoolean(target.accessibility.ariaExpanded, `${label}.accessibility.ariaExpanded`);
  if (!phases.has(target.state.phase)) {
    throw new TypeError(`${label}.state.phase is unsupported.`);
  }
  if (!declaredStates.has(target.state.declared)) {
    throw new TypeError(`${label}.state.declared is unsupported.`);
  }
  if (!motionIntents.has(target.motionIntent)) {
    throw new TypeError(`${label}.motionIntent is unsupported.`);
  }

  return Object.freeze({
    ...target,
    rect: freezeRect(target.rect, `${label}.rect`),
    visual: Object.freeze({ ...target.visual }),
    accessibility: Object.freeze({ ...target.accessibility }),
    state: Object.freeze({ ...target.state }),
  });
}

function mergeLimits(overrides?: Partial<MotionGuardTraceLimits>): MotionGuardTraceLimits {
  const limits = Object.freeze({ ...DEFAULT_TRACE_LIMITS, ...overrides });
  validateLimits(limits);
  return limits;
}

export function defineMotionGuardTrace(
  trace: MotionGuardTrace,
  limitOverrides?: Partial<MotionGuardTraceLimits>,
): MotionGuardTrace {
  const limits = mergeLimits(limitOverrides);
  assertString(trace.scenarioId, "scenarioId", limits.maxStringLength);
  if (trace.schemaVersion !== MOTIONGUARD_TRACE_SCHEMA_VERSION) {
    throw new TypeError(`Unsupported trace schema version: ${trace.schemaVersion}`);
  }
  if (trace.reducedMotion !== "reduce" && trace.reducedMotion !== "no-preference") {
    throw new TypeError("reducedMotion is unsupported.");
  }
  assertNonNegativeFinite(trace.durationMs, "durationMs");
  if (trace.durationMs > limits.maxDurationMs) {
    throw new RangeError(`durationMs exceeds ${String(limits.maxDurationMs)}.`);
  }
  if (trace.frames.length === 0 || trace.frames.length > limits.maxFrames) {
    throw new RangeError(`frames must contain between 1 and ${String(limits.maxFrames)} entries.`);
  }
  if (trace.interactions.length > limits.maxInteractions) {
    throw new RangeError(`interactions exceeds ${String(limits.maxInteractions)} entries.`);
  }

  let previousFrameAt = -1;
  const targetIdentity = new Map<
    string,
    Readonly<{ selector: string | null; motionIntent: MotionGuardTargetSnapshot["motionIntent"] }>
  >();
  const frozenFrames = trace.frames.map((frame, frameIndex) => {
    assertNonNegativeFinite(frame.atMs, `frames[${String(frameIndex)}].atMs`);
    if (frame.atMs <= previousFrameAt) {
      throw new TypeError("frame timestamps must be strictly increasing.");
    }
    if (frame.atMs > trace.durationMs) {
      throw new RangeError(`frames[${String(frameIndex)}].atMs exceeds durationMs.`);
    }
    previousFrameAt = frame.atMs;
    if (frame.targets.length > limits.maxTargetsPerFrame) {
      throw new RangeError(
        `frames[${String(frameIndex)}].targets exceeds ${String(limits.maxTargetsPerFrame)} entries.`,
      );
    }

    const ids = new Set<string>();
    const targets = frame.targets.map((target, targetIndex) => {
      const frozen = freezeTarget(
        target,
        `frames[${String(frameIndex)}].targets[${String(targetIndex)}]`,
        limits.maxStringLength,
      );
      if (ids.has(frozen.id)) {
        throw new TypeError(
          `frames[${String(frameIndex)}] contains duplicate target id: ${frozen.id}`,
        );
      }
      ids.add(frozen.id);
      const identity = targetIdentity.get(frozen.id);
      if (
        identity !== undefined &&
        (identity.selector !== frozen.selector || identity.motionIntent !== frozen.motionIntent)
      ) {
        throw new TypeError(`Target identity metadata changed for id: ${frozen.id}`);
      }
      targetIdentity.set(
        frozen.id,
        Object.freeze({ selector: frozen.selector, motionIntent: frozen.motionIntent }),
      );
      return frozen;
    });

    return Object.freeze({ atMs: frame.atMs, targets: Object.freeze(targets) });
  });

  let previousInteractionAt = -1;
  const interactionIds = new Set<string>();
  const frozenInteractions = trace.interactions.map((event, eventIndex) => {
    const label = `interactions[${String(eventIndex)}]`;
    assertString(event.id, `${label}.id`, limits.maxStringLength);
    assertString(event.targetId, `${label}.targetId`, limits.maxStringLength);
    if (interactionIds.has(event.id)) {
      throw new TypeError(`Duplicate interaction id: ${event.id}`);
    }
    interactionIds.add(event.id);
    assertNonNegativeFinite(event.atMs, `${label}.atMs`);
    if (event.atMs < previousInteractionAt) {
      throw new TypeError("interaction timestamps must be non-decreasing.");
    }
    if (event.atMs > trace.durationMs) {
      throw new RangeError(`${label}.atMs exceeds durationMs.`);
    }
    previousInteractionAt = event.atMs;
    if (!interactionTypes.has(event.type)) {
      throw new TypeError(`${label}.type is unsupported.`);
    }
    if (event.stateValue !== null && event.stateValue !== "open" && event.stateValue !== "closed") {
      throw new TypeError(`${label}.stateValue is unsupported.`);
    }
    if (event.type === "state-change" && event.stateValue === null) {
      throw new TypeError(`${label}.stateValue is required for state-change events.`);
    }
    if (event.type !== "state-change" && event.stateValue !== null) {
      throw new TypeError(`${label}.stateValue is only valid for state-change events.`);
    }
    if (event.key !== null) {
      assertString(event.key, `${label}.key`, limits.maxStringLength);
    }

    return Object.freeze({
      ...event,
      point: freezePoint(event.point, `${label}.point`),
    });
  });

  return Object.freeze({
    schemaVersion: MOTIONGUARD_TRACE_SCHEMA_VERSION,
    scenarioId: trace.scenarioId,
    reducedMotion: trace.reducedMotion,
    durationMs: trace.durationMs,
    frames: Object.freeze(frozenFrames),
    interactions: Object.freeze(frozenInteractions),
  });
}

export function findTargetAtOrBefore(
  trace: MotionGuardTrace,
  targetId: string,
  atMs: number,
): Readonly<{
  frameIndex: number;
  frame: MotionGuardFrame;
  target: MotionGuardTargetSnapshot;
}> | null {
  let low = 0;
  let high = trace.frames.length - 1;
  let frameIndex = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const frame = trace.frames[middle];
    if (frame === undefined) break;
    if (frame.atMs <= atMs) {
      frameIndex = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  if (frameIndex < 0) return null;
  const frame = trace.frames[frameIndex];
  if (frame === undefined) return null;
  const target = frame.targets.find((candidate) => candidate.id === targetId);
  return target === undefined ? null : Object.freeze({ frameIndex, frame, target });
}

export function isVisuallyHidden(
  target: MotionGuardTargetSnapshot,
  opacityThreshold = 0.05,
): boolean {
  return (
    !target.connected ||
    target.visual.display === "none" ||
    target.visual.visibility === "hidden" ||
    target.visual.visibility === "collapse" ||
    target.visual.opacity <= opacityThreshold ||
    target.rect.width === 0 ||
    target.rect.height === 0
  );
}

export function rectCenter(rect: MotionGuardRect): MotionGuardPoint {
  return Object.freeze({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
}

export function distance(a: MotionGuardPoint, b: MotionGuardPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointInsideRect(point: MotionGuardPoint, rect: MotionGuardRect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}
