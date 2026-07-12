from pathlib import Path

path = Path("packages/playwright/src/record.ts")
text = path.read_text()

replacements = [
    (
        '''  let rejectPromise: ((error: Error) => void) | undefined;\n  const promise = new Promise<never>((_, reject) => {\n    rejectPromise = reject;\n  });\n  const onCrash = (): void =>\n    rejectPromise?.(new MotionGuardPlaywrightError("PAGE_CRASHED", "The inspected page crashed."));\n  const onClose = (): void =>\n    rejectPromise?.(\n      new MotionGuardPlaywrightError("PAGE_CLOSED", "The inspected page closed unexpectedly."),\n    );\n  const onDisconnected = (): void =>\n    rejectPromise?.(\n      new MotionGuardPlaywrightError("BROWSER_DISCONNECTED", "The browser disconnected."),\n    );\n''',
        '''  let rejectPromise: ((error: Error) => void) | undefined;\n  let closeTimer: ReturnType<typeof setTimeout> | undefined;\n  let settled = false;\n  const promise = new Promise<never>((_, reject) => {\n    rejectPromise = reject;\n  });\n  const rejectWith = (error: MotionGuardPlaywrightError): void => {\n    if (settled) return;\n    settled = true;\n    if (closeTimer !== undefined) clearTimeout(closeTimer);\n    rejectPromise?.(error);\n  };\n  const onCrash = (): void =>\n    rejectWith(new MotionGuardPlaywrightError("PAGE_CRASHED", "The inspected page crashed."));\n  const onClose = (): void => {\n    closeTimer = setTimeout(() => {\n      if (browser.isConnected()) {\n        rejectWith(\n          new MotionGuardPlaywrightError("PAGE_CLOSED", "The inspected page closed unexpectedly."),\n        );\n        return;\n      }\n      rejectWith(\n        new MotionGuardPlaywrightError("BROWSER_DISCONNECTED", "The browser disconnected."),\n      );\n    }, 25);\n  };\n  const onDisconnected = (): void =>\n    rejectWith(new MotionGuardPlaywrightError("BROWSER_DISCONNECTED", "The browser disconnected."));\n''',
    ),
    (
        '''    dispose: () => {\n      page.off("crash", onCrash);\n''',
        '''    dispose: () => {\n      if (closeTimer !== undefined) clearTimeout(closeTimer);\n      page.off("crash", onCrash);\n''',
    ),
    (
        '''    const page = await Promise.race([context.newPage(), ...guards.promises]);\n    lifecycle = lifecycleGuard(options.browser, page);\n\n    const work = async (): Promise<MotionGuardTrace> => {\n''',
        '''    const page = await Promise.race([context.newPage(), ...guards.promises]);\n    const pageLifecycle = lifecycleGuard(options.browser, page);\n    lifecycle = pageLifecycle;\n\n    const work = async (): Promise<MotionGuardTrace> => {\n''',
    ),
    (
        '''      } catch (error) {\n        if (error instanceof MotionGuardPlaywrightError) throw error;\n        throw new MotionGuardPlaywrightError(\n          "NAVIGATION_FAILED",\n''',
        '''      } catch (error) {\n        if (error instanceof MotionGuardPlaywrightError) throw error;\n        await Promise.race([pageLifecycle.promise, delay(50, options.signal)]);\n        if (!options.browser.isConnected()) {\n          throw new MotionGuardPlaywrightError(\n            "BROWSER_DISCONNECTED",\n            "The browser disconnected.",\n            error,\n          );\n        }\n        throw new MotionGuardPlaywrightError(\n          "NAVIGATION_FAILED",\n''',
    ),
    (
        '''      sampler = (async () => {\n        while (!stopSampling) {\n          await delay(scenario.sampleIntervalMs, options.signal);\n          if (stopSampling) break;\n          await collect();\n        }\n      })();\n\n      await options.run?.({ page });\n''',
        '''      sampler = (async () => {\n        while (!stopSampling) {\n          await delay(scenario.sampleIntervalMs, options.signal);\n          if (stopSampling) break;\n          await collect();\n        }\n      })();\n      void sampler.catch(() => undefined);\n\n      await options.run?.({ page });\n''',
    ),
    (
        '''    result = await Promise.race([work(), lifecycle.promise, ...guards.promises]);\n  } catch (error) {\n    primaryError = error;\n  }\n''',
        '''    result = await Promise.race([work(), pageLifecycle.promise, ...guards.promises]);\n  } catch (error) {\n    if (\n      error instanceof MotionGuardPlaywrightError &&\n      (error.code === "BROWSER_DISCONNECTED" ||\n        error.code === "PAGE_CLOSED" ||\n        error.code === "PAGE_CRASHED")\n    ) {\n      primaryError = error;\n    } else if (!options.browser.isConnected()) {\n      primaryError = new MotionGuardPlaywrightError(\n        "BROWSER_DISCONNECTED",\n        "The browser disconnected.",\n        error,\n      );\n    } else {\n      primaryError = error;\n    }\n  }\n''',
    ),
]

for old, new in replacements:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one source block, found {count}")
    text = text.replace(old, new)

path.write_text(text)
