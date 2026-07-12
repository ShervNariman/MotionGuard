import type { MotionGuardFinding, MotionGuardRuleId } from "../findings.js";
import type { MotionGuardTrace } from "../trace.js";
import type { MotionGuardTraceIndex } from "./helpers.js";

export type MotionGuardRuleOptions = Readonly<{
  movingTarget: Readonly<{
    minimumDistancePx: number;
  }>;
  stateMismatch: Readonly<{
    minimumDurationMs: number;
    interruptionWindowMs: number;
    maximumObservationDelayMs: number;
    opacityThreshold: number;
  }>;
  exitedInteractive: Readonly<{
    minimumDurationMs: number;
    opacityThreshold: number;
  }>;
  reducedMotion: Readonly<{
    maximumDistancePx: number;
  }>;
}>;

export const DEFAULT_RULE_OPTIONS: MotionGuardRuleOptions = Object.freeze({
  movingTarget: Object.freeze({ minimumDistancePx: 8 }),
  stateMismatch: Object.freeze({
    minimumDurationMs: 80,
    interruptionWindowMs: 300,
    maximumObservationDelayMs: 1_000,
    opacityThreshold: 0.05,
  }),
  exitedInteractive: Object.freeze({ minimumDurationMs: 50, opacityThreshold: 0.05 }),
  reducedMotion: Object.freeze({ maximumDistancePx: 24 }),
});

export type MotionGuardRuleContext = Readonly<{
  options: MotionGuardRuleOptions;
  index: MotionGuardTraceIndex;
}>;

export type MotionGuardRule = Readonly<{
  id: MotionGuardRuleId;
  evaluate: (
    trace: MotionGuardTrace,
    context: MotionGuardRuleContext,
  ) => readonly MotionGuardFinding[];
}>;
