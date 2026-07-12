import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { evaluateMotionGuardTrace } from "@motionguard/core";
import { recordMotionTrace } from "@motionguard/playwright";
import {
  defineMotionGuardReport,
  renderHtmlReport,
  serializeJsonReport,
  serializeJUnitReport,
  type MotionGuardReport,
  type MotionGuardScenarioReport,
} from "@motionguard/reporter";
import { chromium, type Page } from "playwright";
import type { MotionGuardCliAction, MotionGuardCliConfig } from "./config.js";

export type MotionGuardOutputFormat = "all" | "json" | "junit" | "html";

function safeOutputDir(value: string, cwd: string): string {
  const root = resolve(cwd);
  const output = resolve(root, value);
  const relativePath = relative(root, output);
  const escapes =
    relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath);
  if (relativePath.length === 0 || escapes) {
    throw new TypeError("outputDir must be a child directory of the current working directory.");
  }
  return output;
}

async function runActions(actions: readonly MotionGuardCliAction[], page: Page): Promise<void> {
  for (const action of actions) {
    if (action.type === "wait") {
      await page.waitForTimeout(action.ms);
    } else if (action.type === "click") {
      await page.locator(action.selector).click();
    } else if (action.type === "hover") {
      await page.locator(action.selector).hover();
    } else {
      await page.locator(action.selector).press(action.key);
    }
  }
}

export async function executeMotionGuard(
  config: MotionGuardCliConfig,
  options: Readonly<{
    cwd?: string;
    format?: MotionGuardOutputFormat;
    outputDir?: string;
    now?: () => Date;
  }> = {},
): Promise<MotionGuardReport> {
  const cwd = options.cwd ?? process.cwd();
  const outputDir = safeOutputDir(options.outputDir ?? config.outputDir, cwd);
  const browser = await chromium.launch({ headless: true });
  const scenarios: MotionGuardScenarioReport[] = [];

  try {
    for (const scenario of config.scenarios) {
      const { actions = [], ...captureScenario } = scenario;
      const trace = await recordMotionTrace({
        browser,
        scenario: captureScenario,
        run: async ({ page }) => runActions(actions, page),
      });
      const evaluation = evaluateMotionGuardTrace(trace);
      scenarios.push(
        Object.freeze({
          id: scenario.id,
          url: scenario.url,
          passed: evaluation.passed,
          durationMs: trace.durationMs,
          frameCount: trace.frames.length,
          interactionCount: trace.interactions.length,
          findings: evaluation.findings,
          ...(config.includeTrace ? { trace } : {}),
        }),
      );
    }
  } finally {
    await browser.close();
  }

  const report = defineMotionGuardReport(
    scenarios,
    (options.now ?? (() => new Date()))().toISOString(),
  );
  await mkdir(outputDir, { recursive: true });
  const format = options.format ?? "all";
  const writes: Promise<void>[] = [];
  if (format === "all" || format === "json") {
    writes.push(
      writeFile(resolve(outputDir, "report.json"), `${serializeJsonReport(report)}\n`, "utf8"),
    );
  }
  if (format === "all" || format === "junit") {
    writes.push(
      writeFile(resolve(outputDir, "report.junit.xml"), serializeJUnitReport(report), "utf8"),
    );
  }
  if (format === "all" || format === "html") {
    writes.push(writeFile(resolve(outputDir, "report.html"), renderHtmlReport(report), "utf8"));
  }
  await Promise.all(writes);
  return report;
}
