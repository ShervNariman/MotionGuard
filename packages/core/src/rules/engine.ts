import type { MotionGuardEvaluation, MotionGuardFinding } from "../findings.js";
import type { MotionGuardTrace } from "../trace.js";
import { exitedButInteractiveRule } from "./exited-interactive.js";
import { createTraceIndex } from "./helpers.js";
import { movingInteractionTargetRule } from "./moving-target.js";
import { reducedMotionMismatchRule } from "./reduced-motion.js";
import { interruptedStateMismatchRule } from "./state-mismatch.js";
import {
  DEFAULT_RULE_OPTIONS,
  type MotionGuardRule,
  type MotionGuardRuleOptions,
} from "./types.js";

export const DEFAULT_MOTIONGUARD_RULES: readonly MotionGuardRule[] = Object.freeze([
  movingInteractionTargetRule,
  interruptedStateMismatchRule,
  exitedButInteractiveRule,
  reducedMotionMismatchRule,
]);

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${label} must be positive.`);
  return value;
}

function probability(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new TypeError(`${label} must be between 0 and 1.`);
  }
  return value;
}

export function defineRuleOptions(
  overrides?: Partial<{
    movingTarget: Partial<MotionGuardRuleOptions["movingTarget"]>;
    stateMismatch: Partial<MotionGuardRuleOptions["stateMismatch"]>;
    exitedInteractive: Partial<MotionGuardRuleOptions["exitedInteractive"]>;
    reducedMotion: Partial<MotionGuardRuleOptions["reducedMotion"]>;
  }>,
): MotionGuardRuleOptions {
  const options: MotionGuardRuleOptions = Object.freeze({
    movingTarget: Object.freeze({
      ...DEFAULT_RULE_OPTIONS.movingTarget,
      ...overrides?.movingTarget,
    }),
    stateMismatch: Object.freeze({
      ...DEFAULT_RULE_OPTIONS.stateMismatch,
      ...overrides?.stateMismatch,
    }),
    exitedInteractive: Object.freeze({
      ...DEFAULT_RULE_OPTIONS.exitedInteractive,
      ...overrides?.exitedInteractive,
    }),
    reducedMotion: Object.freeze({
      ...DEFAULT_RULE_OPTIONS.reducedMotion,
      ...overrides?.reducedMotion,
    }),
  });

  positive(options.movingTarget.minimumDistancePx, "movingTarget.minimumDistancePx");
  positive(options.stateMismatch.minimumDurationMs, "stateMismatch.minimumDurationMs");
  positive(options.stateMismatch.interruptionWindowMs, "stateMismatch.interruptionWindowMs");
  positive(
    options.stateMismatch.maximumObservationDelayMs,
    "stateMismatch.maximumObservationDelayMs",
  );
  probability(options.stateMismatch.opacityThreshold, "stateMismatch.opacityThreshold");
  positive(options.exitedInteractive.minimumDurationMs, "exitedInteractive.minimumDurationMs");
  probability(options.exitedInteractive.opacityThreshold, "exitedInteractive.opacityThreshold");
  positive(options.reducedMotion.maximumDistancePx, "reducedMotion.maximumDistancePx");
  return options;
}

export function evaluateMotionGuardTrace(
  trace: MotionGuardTrace,
  configuration?: Readonly<{
    rules?: readonly MotionGuardRule[];
    options?: Parameters<typeof defineRuleOptions>[0];
  }>,
): MotionGuardEvaluation {
  const options = defineRuleOptions(configuration?.options);
  const rules = configuration?.rules ?? DEFAULT_MOTIONGUARD_RULES;
  const index = createTraceIndex(trace);
  const context = Object.freeze({ options, index });
  const findings: MotionGuardFinding[] = [];
  const ids = new Set<string>();

  for (const rule of rules) {
    for (const finding of rule.evaluate(trace, context)) {
      if (!ids.has(finding.id)) {
        ids.add(finding.id);
        findings.push(finding);
      }
    }
  }

  const compareText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
  findings.sort(
    (a, b) =>
      a.evidence.startMs - b.evidence.startMs ||
      compareText(a.ruleId, b.ruleId) ||
      compareText(a.targetId, b.targetId),
  );

  return Object.freeze({ passed: findings.length === 0, findings: Object.freeze(findings) });
}
