import {
  defineMotionGuardTrace,
  type MotionGuardFrame,
  type MotionGuardInteractionEvent,
  type MotionGuardTargetSnapshot,
  type MotionGuardTrace,
} from "../src/index.js";

export function target(
  overrides: Partial<MotionGuardTargetSnapshot> = {},
): MotionGuardTargetSnapshot {
  return {
    id: "target",
    selector: "#target",
    connected: true,
    rect: { x: 0, y: 0, width: 100, height: 40 },
    visual: {
      display: "block",
      visibility: "visible",
      opacity: 1,
      pointerEvents: "auto",
      transform: "none",
    },
    accessibility: {
      focusable: false,
      focused: false,
      ariaHidden: false,
      ariaExpanded: null,
    },
    state: { declared: null, phase: "idle" },
    motionIntent: "unknown",
    ...overrides,
  };
}

export function frame(
  atMs: number,
  targets: readonly MotionGuardTargetSnapshot[],
): MotionGuardFrame {
  return { atMs, targets };
}

export function event(
  id: string,
  atMs: number,
  type: MotionGuardInteractionEvent["type"],
  overrides: Partial<MotionGuardInteractionEvent> = {},
): MotionGuardInteractionEvent {
  return {
    id,
    atMs,
    type,
    targetId: "target",
    point: null,
    key: null,
    stateValue: type === "state-change" ? "open" : null,
    ...overrides,
  };
}

export function trace(
  frames: readonly MotionGuardFrame[],
  interactions: readonly MotionGuardInteractionEvent[] = [],
  overrides: Partial<MotionGuardTrace> = {},
): MotionGuardTrace {
  const lastFrame = frames.at(-1);
  const lastInteraction = interactions.at(-1);
  const durationMs = Math.max(lastFrame?.atMs ?? 0, lastInteraction?.atMs ?? 0);
  return defineMotionGuardTrace({
    schemaVersion: "0.1",
    scenarioId: "test-scenario",
    reducedMotion: "no-preference",
    durationMs,
    frames,
    interactions,
    ...overrides,
  });
}
