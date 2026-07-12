export {
  DEFAULT_MOTIONGUARD_RULES,
  defineRuleOptions,
  evaluateMotionGuardTrace,
} from "./engine.js";
export { exitedButInteractiveRule } from "./exited-interactive.js";
export { movingInteractionTargetRule } from "./moving-target.js";
export { reducedMotionMismatchRule } from "./reduced-motion.js";
export { interruptedStateMismatchRule } from "./state-mismatch.js";
export { DEFAULT_RULE_OPTIONS } from "./types.js";
export type {
  MotionGuardRule,
  MotionGuardRuleContext,
  MotionGuardRuleOptions,
} from "./types.js";
