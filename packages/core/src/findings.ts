export type MotionGuardRuleId =
  | "moving-interaction-target"
  | "interrupted-state-mismatch"
  | "exited-but-interactive"
  | "reduced-motion-mismatch";

export type MotionGuardFindingSeverity = "error" | "warning";
export type MotionGuardFindingConfidence = "high" | "medium";
export type MotionGuardEvidenceMetric = string | number | boolean;

export type MotionGuardFindingEvidence = Readonly<{
  startMs: number;
  endMs: number;
  frameIndexes: readonly number[];
  interactionIds: readonly string[];
  metrics: Readonly<Record<string, MotionGuardEvidenceMetric>>;
}>;

export type MotionGuardFinding = Readonly<{
  id: string;
  ruleId: MotionGuardRuleId;
  severity: MotionGuardFindingSeverity;
  confidence: MotionGuardFindingConfidence;
  targetId: string;
  title: string;
  message: string;
  remediation: string;
  evidence: MotionGuardFindingEvidence;
}>;

export type MotionGuardEvaluation = Readonly<{
  passed: boolean;
  findings: readonly MotionGuardFinding[];
}>;

export function createFinding(
  finding: Omit<MotionGuardFinding, "id"> & Readonly<{ scenarioId: string }>,
): MotionGuardFinding {
  const { scenarioId, ...rest } = finding;
  const id = `${rest.ruleId}:${scenarioId}:${rest.targetId}:${String(rest.evidence.startMs)}`;
  return Object.freeze({
    ...rest,
    id,
    evidence: Object.freeze({
      ...rest.evidence,
      frameIndexes: Object.freeze([...rest.evidence.frameIndexes]),
      interactionIds: Object.freeze([...rest.evidence.interactionIds]),
      metrics: Object.freeze({ ...rest.evidence.metrics }),
    }),
  });
}
