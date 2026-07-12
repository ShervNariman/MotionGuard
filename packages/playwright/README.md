# @motionguard/playwright

Isolated Playwright capture adapter for MotionGuard.

> Prerelease API: the browser capture contract may change before the first stable release.

## Safety defaults

- Creates a fresh browser context for every run.
- Blocks service workers and downloads.
- Keeps Content Security Policy enforcement enabled.
- Allows loopback URLs by default; remote origins require an exact allowlist entry.
- Bounds duration, sampling interval, target count, and generated trace size.
- Closes the context on success, action failure, timeout, abort, page crash, or browser disconnect.
- Never closes a caller-owned `Browser` instance.

## Example

```ts
import { chromium } from "playwright";
import { recordMotionTrace } from "@motionguard/playwright";

const browser = await chromium.launch();
try {
  const trace = await recordMotionTrace({
    browser,
    scenario: {
      id: "dialog-reversal",
      url: "http://127.0.0.1:3000/demo",
      viewport: { width: 1280, height: 720 },
      reducedMotion: "no-preference",
      targets: [
        {
          id: "dialog",
          selector: "[data-dialog]",
          motionIntent: "non-essential",
        },
      ],
    },
    run: async ({ page }) => {
      await page.getByRole("button", { name: "Open" }).click();
      await page.waitForTimeout(40);
      await page.getByRole("button", { name: "Close" }).click();
    },
  });
  console.log(trace.frames.length);
} finally {
  await browser.close();
}
```
