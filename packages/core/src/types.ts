export type MotionGuardViewport = Readonly<{
  width: number;
  height: number;
  deviceScaleFactor?: number;
}>;

export type MotionGuardInteraction = Readonly<{
  kind: "click" | "keyboard" | "pointer" | "programmatic";
  target: string;
}>;

export type MotionGuardScenario = Readonly<{
  id: string;
  name: string;
  interaction: MotionGuardInteraction;
  viewport: MotionGuardViewport;
  reducedMotion: "reduce" | "no-preference";
}>;

export type MotionGuardConfig = Readonly<{
  baseUrl: string;
  scenarios: readonly MotionGuardScenario[];
}>;

export type MotionGuardRunSummary = Readonly<{
  schemaVersion: typeof MOTIONGUARD_SCHEMA_VERSION;
  startedAt: string;
  completedAt: string;
  passed: boolean;
  scenarioCount: number;
}>;

export const MOTIONGUARD_SCHEMA_VERSION = "0.1" as const;
