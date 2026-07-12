import type { MotionGuardTrace, MotionGuardViewport } from "@motionguard/core";
import type { Browser, Page } from "playwright-core";

export type MotionGuardStateMapping = Readonly<{
  attribute: string;
  openValues?: readonly string[];
  closedValues?: readonly string[];
  enteringValues?: readonly string[];
  exitingValues?: readonly string[];
}>;

export type MotionGuardPlaywrightTarget = Readonly<{
  id: string;
  selector: string;
  motionIntent: "essential" | "non-essential" | "unknown";
  state?: MotionGuardStateMapping;
}>;

export type MotionGuardPlaywrightScenario = Readonly<{
  id: string;
  url: string;
  viewport: MotionGuardViewport;
  reducedMotion: "reduce" | "no-preference";
  targets: readonly MotionGuardPlaywrightTarget[];
  allowedOrigins?: readonly string[];
  sampleIntervalMs?: number;
  settleMs?: number;
  timeoutMs?: number;
  navigationTimeoutMs?: number;
}>;

export type MotionGuardRunContext = Readonly<{
  page: Page;
}>;

export type RecordMotionTraceOptions = Readonly<{
  browser: Browser;
  scenario: MotionGuardPlaywrightScenario;
  run?: (context: MotionGuardRunContext) => Promise<void>;
  signal?: AbortSignal;
}>;

export type RecordMotionTrace = (options: RecordMotionTraceOptions) => Promise<MotionGuardTrace>;
