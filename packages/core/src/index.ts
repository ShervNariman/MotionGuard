export { defineMotionGuardConfig } from "./config.js";
export {
  createFinding,
  type MotionGuardEvaluation,
  type MotionGuardEvidenceMetric,
  type MotionGuardFinding,
  type MotionGuardFindingConfidence,
  type MotionGuardFindingEvidence,
  type MotionGuardFindingSeverity,
  type MotionGuardRuleId,
} from "./findings.js";
export {
  DEFAULT_MOTIONGUARD_RULES,
  DEFAULT_RULE_OPTIONS,
  defineRuleOptions,
  evaluateMotionGuardTrace,
  exitedButInteractiveRule,
  interruptedStateMismatchRule,
  movingInteractionTargetRule,
  reducedMotionMismatchRule,
} from "./rules/index.js";
export type {
  MotionGuardRule,
  MotionGuardRuleContext,
  MotionGuardRuleOptions,
} from "./rules/index.js";
export {
  DEFAULT_TRACE_LIMITS,
  MOTIONGUARD_TRACE_SCHEMA_VERSION,
  defineMotionGuardTrace,
  distance,
  findTargetAtOrBefore,
  isVisuallyHidden,
  pointInsideRect,
  rectCenter,
} from "./trace.js";
export type {
  MotionGuardAccessibilitySnapshot,
  MotionGuardFrame,
  MotionGuardInteractionEvent,
  MotionGuardPoint,
  MotionGuardRect,
  MotionGuardStateSnapshot,
  MotionGuardTargetSnapshot,
  MotionGuardTrace,
  MotionGuardTraceLimits,
  MotionGuardVisualSnapshot,
} from "./trace.js";
export { MOTIONGUARD_SCHEMA_VERSION } from "./types.js";
export type {
  MotionGuardConfig,
  MotionGuardInteraction,
  MotionGuardRunSummary,
  MotionGuardScenario,
  MotionGuardViewport,
} from "./types.js";
