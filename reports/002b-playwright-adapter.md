# MotionGuard Major-Step Report 002B — Isolated Playwright Adapter

**Objective:** Record real webpage motion into the deterministic core trace format without leaking contexts, trusting remote URLs by default, or coupling core to Playwright.

## Shipped

- `@motionguard/playwright` with a caller-owned browser and isolated context per capture.
- Explicit loopback-only default URL policy and exact remote-origin allowlisting.
- Bounded target validation, frame sampling, pointer/keyboard interaction capture, focus and visual snapshots, declared state inference, reduced-motion emulation, and motion-intent metadata.
- Cleanup on success, action failure, timeout, abort, page crash, page close, and browser disconnect.
- Real Chromium fixtures for all four initial findings plus isolation, service-worker, missing-target, duplicate-target, timeout, failure, and abort paths.

## Five-loop evidence

This report remains draft until exact-head CI, browser E2E, CodeQL, QA Agent review, and Senior Code Health review pass.

## Capability boundary

The adapter records explicitly configured targets on an explicitly allowed URL. It is not a crawler, does not discover targets automatically, and does not yet expose the complete CLI workflow.
