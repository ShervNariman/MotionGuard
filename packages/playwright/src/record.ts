import {
  defineMotionGuardTrace,
  type MotionGuardFrame,
  type MotionGuardInteractionEvent,
  type MotionGuardTrace,
} from "@motionguard/core";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { normalizeScenario } from "./config.js";
import { MotionGuardPlaywrightError } from "./errors.js";
import { asFrame, installPageRecorder, samplePage, validateTargets } from "./page-recorder.js";
import type { RecordMotionTraceOptions } from "./types.js";

function abortError(reason?: unknown): MotionGuardPlaywrightError {
  return new MotionGuardPlaywrightError(
    "ABORTED",
    typeof reason === "string" ? reason : "MotionGuard capture was aborted.",
    reason,
  );
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError(signal.reason);
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted === true) return Promise.reject(abortError(signal.reason));
  return new Promise((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(abortError(signal?.reason));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function lifecycleGuard(
  browser: Browser,
  page: Page,
): Readonly<{
  promise: Promise<never>;
  dispose: () => void;
}> {
  let rejectPromise: ((error: Error) => void) | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  const promise = new Promise<never>((_, reject) => {
    rejectPromise = reject;
  });
  const rejectWith = (error: MotionGuardPlaywrightError): void => {
    if (settled) return;
    settled = true;
    if (closeTimer !== undefined) clearTimeout(closeTimer);
    rejectPromise?.(error);
  };
  const onCrash = (): void =>
    rejectWith(new MotionGuardPlaywrightError("PAGE_CRASHED", "The inspected page crashed."));
  const onClose = (): void => {
    closeTimer = setTimeout(() => {
      if (browser.isConnected()) {
        rejectWith(
          new MotionGuardPlaywrightError("PAGE_CLOSED", "The inspected page closed unexpectedly."),
        );
        return;
      }
      rejectWith(
        new MotionGuardPlaywrightError("BROWSER_DISCONNECTED", "The browser disconnected."),
      );
    }, 25);
  };
  const onDisconnected = (): void =>
    rejectWith(new MotionGuardPlaywrightError("BROWSER_DISCONNECTED", "The browser disconnected."));
  page.once("crash", onCrash);
  page.once("close", onClose);
  browser.once("disconnected", onDisconnected);
  return Object.freeze({
    promise,
    dispose: () => {
      if (closeTimer !== undefined) clearTimeout(closeTimer);
      page.off("crash", onCrash);
      page.off("close", onClose);
      browser.off("disconnected", onDisconnected);
    },
  });
}

function executionGuards(
  timeoutMs: number,
  signal?: AbortSignal,
): Readonly<{ promises: readonly Promise<never>[]; dispose: () => void }> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(
      () =>
        reject(
          new MotionGuardPlaywrightError("TIMEOUT", `Capture exceeded ${String(timeoutMs)} ms.`),
        ),
      timeoutMs,
    );
  });
  const promises: Promise<never>[] = [timeout];
  if (signal !== undefined) {
    promises.push(
      new Promise<never>((_, reject) => {
        onAbort = () => reject(abortError(signal.reason));
        signal.addEventListener("abort", onAbort, { once: true });
      }),
    );
  }
  return Object.freeze({
    promises: Object.freeze(promises),
    dispose: () => {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
      if (onAbort !== undefined) signal?.removeEventListener("abort", onAbort);
    },
  });
}

async function closeContext(
  browser: Browser,
  context: BrowserContext | undefined,
  reason: string,
): Promise<MotionGuardPlaywrightError | null> {
  if (context === undefined) return null;
  try {
    await context.close({ reason });
    return null;
  } catch (error) {
    return browser.isConnected()
      ? new MotionGuardPlaywrightError(
          "CLEANUP_FAILED",
          "MotionGuard could not close the isolated browser context.",
          error,
        )
      : null;
  }
}

function allowedNetworkOrigins(
  url: string,
  allowedOrigins: readonly string[],
): ReadonlySet<string> {
  return new Set([new URL(url).origin, ...allowedOrigins]);
}

export async function recordMotionTrace(
  options: RecordMotionTraceOptions,
): Promise<MotionGuardTrace> {
  const scenario = normalizeScenario(options.scenario);
  throwIfAborted(options.signal);

  let context: BrowserContext | undefined;
  let lifecycle: ReturnType<typeof lifecycleGuard> | undefined;
  let guards: ReturnType<typeof executionGuards> | undefined;
  let primaryError: unknown;
  let result: MotionGuardTrace | undefined;
  let stopSampling = false;
  let sampler: Promise<void> | undefined;
  const frames: MotionGuardFrame[] = [];
  const interactions: MotionGuardInteractionEvent[] = [];
  const stateByTarget = new Map<string, "open" | "closed" | null>();

  try {
    context = await options.browser.newContext({
      acceptDownloads: false,
      bypassCSP: false,
      reducedMotion: scenario.reducedMotion,
      serviceWorkers: "block",
      viewport: {
        width: scenario.viewport.width,
        height: scenario.viewport.height,
      },
      ...(scenario.viewport.deviceScaleFactor === undefined
        ? {}
        : { deviceScaleFactor: scenario.viewport.deviceScaleFactor }),
    });
    throwIfAborted(options.signal);
    guards = executionGuards(scenario.timeoutMs, options.signal);
    context.setDefaultTimeout(scenario.timeoutMs);
    context.setDefaultNavigationTimeout(scenario.navigationTimeoutMs);

    const networkOrigins = allowedNetworkOrigins(scenario.url, scenario.allowedOrigins);
    await context.route("**/*", async (route) => {
      const requestUrl = route.request().url();
      try {
        const parsed = new URL(requestUrl);
        if (
          (parsed.protocol === "http:" || parsed.protocol === "https:") &&
          !networkOrigins.has(parsed.origin)
        ) {
          await route.abort("blockedbyclient");
          return;
        }
      } catch {
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
    });

    const page = await Promise.race([context.newPage(), ...guards.promises]);
    const pageLifecycle = lifecycleGuard(options.browser, page);
    lifecycle = pageLifecycle;

    const work = async (): Promise<MotionGuardTrace> => {
      try {
        await page.goto(scenario.url, {
          waitUntil: "domcontentloaded",
          timeout: scenario.navigationTimeoutMs,
        });
      } catch (error) {
        if (error instanceof MotionGuardPlaywrightError) throw error;
        await Promise.race([pageLifecycle.promise, delay(50, options.signal)]);
        if (!options.browser.isConnected()) {
          throw new MotionGuardPlaywrightError(
            "BROWSER_DISCONNECTED",
            "The browser disconnected.",
            error,
          );
        }
        throw new MotionGuardPlaywrightError(
          "NAVIGATION_FAILED",
          `Navigation failed for ${scenario.url}.`,
          error,
        );
      }
      const finalUrl = new URL(page.url());
      if (!networkOrigins.has(finalUrl.origin)) {
        throw new MotionGuardPlaywrightError(
          "REMOTE_ORIGIN_NOT_ALLOWED",
          `Navigation redirected to non-allowlisted origin ${finalUrl.origin}.`,
        );
      }
      await validateTargets(page, scenario);
      const recorder = await installPageRecorder(page, scenario);

      const collect = async (): Promise<void> => {
        const sample = await samplePage(page, recorder.key, scenario);
        const previousAt = frames.at(-1)?.atMs ?? -1;
        const normalizedAt = Math.max(sample.atMs, previousAt + 0.001);
        frames.push(Object.freeze({ ...asFrame(sample), atMs: normalizedAt }));
        interactions.push(...sample.interactions);
        for (const target of sample.targets) {
          const previous = stateByTarget.get(target.id);
          if (
            previous !== undefined &&
            previous !== target.state.declared &&
            target.state.declared !== null
          ) {
            interactions.push(
              Object.freeze({
                id: `state-change-${target.id}-${String(interactions.length + 1)}`,
                atMs: normalizedAt,
                type: "state-change",
                targetId: target.id,
                point: null,
                key: null,
                stateValue: target.state.declared,
              }),
            );
          }
          stateByTarget.set(target.id, target.state.declared);
        }
      };

      await collect();
      sampler = (async () => {
        while (!stopSampling) {
          await delay(scenario.sampleIntervalMs, options.signal);
          if (stopSampling) break;
          await collect();
        }
      })();

      await options.run?.({ page });
      await delay(scenario.settleMs, options.signal);
      stopSampling = true;
      await sampler;
      await collect();

      interactions.sort((a, b) => a.atMs - b.atMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const durationMs = frames.at(-1)?.atMs ?? 0;
      return defineMotionGuardTrace({
        schemaVersion: "0.1",
        scenarioId: scenario.id,
        reducedMotion: scenario.reducedMotion,
        durationMs,
        frames,
        interactions,
      });
    };

    result = await Promise.race([work(), pageLifecycle.promise, ...guards.promises]);
  } catch (error) {
    if (
      error instanceof MotionGuardPlaywrightError &&
      (error.code === "BROWSER_DISCONNECTED" ||
        error.code === "PAGE_CLOSED" ||
        error.code === "PAGE_CRASHED")
    ) {
      primaryError = error;
    } else if (!options.browser.isConnected()) {
      primaryError = new MotionGuardPlaywrightError(
        "BROWSER_DISCONNECTED",
        "The browser disconnected.",
        error,
      );
    } else {
      primaryError = error;
    }
  }

  stopSampling = true;
  guards?.dispose();
  lifecycle?.dispose();
  const cleanupError = await closeContext(options.browser, context, "MotionGuard capture complete");
  await sampler?.catch(() => undefined);

  if (cleanupError !== null) {
    if (primaryError !== undefined) {
      throw new AggregateError(
        [primaryError, cleanupError],
        "MotionGuard capture failed and the isolated context could not be cleaned up.",
      );
    }
    throw cleanupError;
  }
  if (primaryError !== undefined) throw primaryError;
  if (result === undefined) {
    throw new MotionGuardPlaywrightError(
      "INVALID_CONFIGURATION",
      "MotionGuard capture completed without producing a trace.",
    );
  }
  return result;
}
