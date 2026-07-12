import { evaluateMotionGuardTrace } from "@motionguard/core";
import { type Browser, chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { recordMotionTrace } from "../../src/index.js";
import { closeFixtureServer, startFixtureServer } from "./server.js";

let browser: Browser;
let origin: string;
let fixtureServer: Awaited<ReturnType<typeof startFixtureServer>>["server"];

const baseScenario = {
  viewport: { width: 1280, height: 720 },
  reducedMotion: "no-preference" as const,
  sampleIntervalMs: 10,
  settleMs: 140,
  timeoutMs: 4_000,
};

beforeAll(async () => {
  const fixture = await startFixtureServer();
  fixtureServer = fixture.server;
  origin = fixture.origin;
  const { MOTIONGUARD_CHROMIUM_PATH: chromiumPath } = process.env;
  browser = await chromium.launch({
    headless: true,
    ...(chromiumPath === undefined ? {} : { executablePath: chromiumPath }),
  });
});

afterAll(async () => {
  await browser?.close();
  await closeFixtureServer(fixtureServer);
});

describe("recordMotionTrace", () => {
  it("detects a moving interaction target across five isolated runs", async () => {
    for (let run = 0; run < 5; run += 1) {
      const trace = await recordMotionTrace({
        browser,
        scenario: {
          ...baseScenario,
          id: `moving-${String(run)}`,
          url: origin,
          targets: [{ id: "moving", selector: "#moving", motionIntent: "non-essential" }],
        },
        run: async ({ page }) => {
          const box = await page.locator("#moving").boundingBox();
          if (box === null) throw new Error("Moving target has no box.");
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(80);
          await page.mouse.up();
        },
      });
      expect(evaluateMotionGuardTrace(trace).findings.map((finding) => finding.ruleId)).toContain(
        "moving-interaction-target",
      );
      expect(browser.contexts()).toHaveLength(0);
    }
  });

  it("detects an interrupted state mismatch", async () => {
    const trace = await recordMotionTrace({
      browser,
      scenario: {
        ...baseScenario,
        id: "state-reversal",
        url: origin,
        settleMs: 180,
        targets: [{ id: "state-panel", selector: "#state-panel", motionIntent: "non-essential" }],
      },
      run: async ({ page }) => {
        await page.locator("#state-trigger").click();
        await page.waitForTimeout(50);
        await page.locator("#state-trigger").click();
      },
    });
    expect(evaluateMotionGuardTrace(trace).findings.map((finding) => finding.ruleId)).toContain(
      "interrupted-state-mismatch",
    );
  });

  it("detects a visually exited target that stays interactive", async () => {
    const trace = await recordMotionTrace({
      browser,
      scenario: {
        ...baseScenario,
        id: "exited-interactive",
        url: origin,
        targets: [{ id: "exited", selector: "#exited", motionIntent: "non-essential" }],
      },
      run: async ({ page }) => {
        await page.locator("#exited").focus();
        await page.locator("#exited").evaluate((element) => {
          element.style.opacity = "0";
        });
      },
    });
    expect(evaluateMotionGuardTrace(trace).findings.map((finding) => finding.ruleId)).toContain(
      "exited-but-interactive",
    );
  });

  it("detects non-essential spatial movement under reduced motion", async () => {
    let reducedMotionMatched = false;
    const trace = await recordMotionTrace({
      browser,
      scenario: {
        ...baseScenario,
        id: "reduced-motion",
        url: origin,
        reducedMotion: "reduce",
        targets: [{ id: "reduced", selector: "#reduced", motionIntent: "non-essential" }],
      },
      run: async ({ page }) => {
        reducedMotionMatched = await page.evaluate(
          () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        );
        await page.locator("#reduced").evaluate((element) => {
          element.style.transform = "translateX(64px)";
        });
      },
    });
    expect(reducedMotionMatched).toBe(true);
    expect(evaluateMotionGuardTrace(trace).findings.map((finding) => finding.ruleId)).toContain(
      "reduced-motion-mismatch",
    );
  });

  it("blocks service workers inside the isolated context", async () => {
    await recordMotionTrace({
      browser,
      scenario: {
        ...baseScenario,
        id: "service-worker-isolation",
        url: origin,
        targets: [{ id: "moving", selector: "#moving", motionIntent: "unknown" }],
      },
      run: async ({ page }) => {
        await page.evaluate(async () => {
          try {
            await navigator.serviceWorker.register("/service-worker.js");
          } catch {
            // Expected when service workers are blocked.
          }
        });
        expect(page.context().serviceWorkers()).toHaveLength(0);
      },
    });
  });

  it("closes the context when the action fails", async () => {
    await expect(
      recordMotionTrace({
        browser,
        scenario: {
          ...baseScenario,
          id: "action-failure",
          url: origin,
          targets: [{ id: "moving", selector: "#moving", motionIntent: "unknown" }],
        },
        run: async () => {
          throw new Error("deliberate action failure");
        },
      }),
    ).rejects.toThrow("deliberate action failure");
    expect(browser.contexts()).toHaveLength(0);
  });

  it("times out and closes the context", async () => {
    await expect(
      recordMotionTrace({
        browser,
        scenario: {
          ...baseScenario,
          id: "timeout",
          url: origin,
          timeoutMs: 120,
          settleMs: 20,
          targets: [{ id: "moving", selector: "#moving", motionIntent: "unknown" }],
        },
        run: async ({ page }) => page.waitForTimeout(500),
      }),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(browser.contexts()).toHaveLength(0);
  });

  it("reports missing and duplicate targets and closes each context", async () => {
    await expect(
      recordMotionTrace({
        browser,
        scenario: {
          ...baseScenario,
          id: "missing",
          url: origin,
          targets: [{ id: "missing", selector: "#does-not-exist", motionIntent: "unknown" }],
        },
      }),
    ).rejects.toMatchObject({ code: "TARGET_NOT_FOUND" });

    await expect(
      recordMotionTrace({
        browser,
        scenario: {
          ...baseScenario,
          id: "duplicate",
          url: origin,
          targets: [{ id: "duplicate", selector: ".fixture", motionIntent: "unknown" }],
        },
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE_TARGET" });
    expect(browser.contexts()).toHaveLength(0);
  });

  it("reports an unexpected page close and releases the context", async () => {
    await expect(
      recordMotionTrace({
        browser,
        scenario: {
          ...baseScenario,
          id: "page-close",
          url: origin,
          targets: [{ id: "moving", selector: "#moving", motionIntent: "unknown" }],
        },
        run: async ({ page }) => {
          await page.close();
        },
      }),
    ).rejects.toMatchObject({ code: "PAGE_CLOSED" });
    expect(browser.contexts()).toHaveLength(0);
  });

  it("reports a Chromium page crash and releases the context", async () => {
    await expect(
      recordMotionTrace({
        browser,
        scenario: {
          ...baseScenario,
          id: "page-crash",
          url: origin,
          targets: [{ id: "moving", selector: "#moving", motionIntent: "unknown" }],
        },
        run: async ({ page }) => {
          await page.goto("chrome://crash").catch(() => undefined);
        },
      }),
    ).rejects.toMatchObject({ code: "PAGE_CRASHED" });
    expect(browser.contexts()).toHaveLength(0);
  });

  it("reports a browser disconnect without trying to retain its context", async () => {
    const disposableBrowser = await chromium.launch({ headless: true });
    const result = recordMotionTrace({
      browser: disposableBrowser,
      scenario: {
        ...baseScenario,
        id: "browser-disconnect",
        url: origin,
        targets: [{ id: "moving", selector: "#moving", motionIntent: "unknown" }],
      },
      run: async ({ page }) => page.waitForTimeout(500),
    });
    setTimeout(() => void disposableBrowser.close(), 60);
    await expect(result).rejects.toMatchObject({ code: "BROWSER_DISCONNECTED" });
    expect(disposableBrowser.isConnected()).toBe(false);
  });

  it("blocks non-allowlisted cross-origin network requests", async () => {
    let blocked = false;
    await recordMotionTrace({
      browser,
      scenario: {
        ...baseScenario,
        id: "network-origin-isolation",
        url: origin,
        targets: [{ id: "moving", selector: "#moving", motionIntent: "unknown" }],
      },
      run: async ({ page }) => {
        blocked = await page.evaluate(async () => {
          try {
            await fetch("https://example.com/motionguard-network-test");
            return false;
          } catch {
            return true;
          }
        });
      },
    });
    expect(blocked).toBe(true);
  });

  it("aborts and closes the context", async () => {
    const controller = new AbortController();
    const result = recordMotionTrace({
      browser,
      signal: controller.signal,
      scenario: {
        ...baseScenario,
        id: "abort",
        url: origin,
        targets: [{ id: "moving", selector: "#moving", motionIntent: "unknown" }],
      },
      run: async ({ page }) => page.waitForTimeout(500),
    });
    setTimeout(() => controller.abort("test abort"), 60);
    await expect(result).rejects.toMatchObject({
      code: "ABORTED",
    });
    expect(browser.contexts()).toHaveLength(0);
  });
});
