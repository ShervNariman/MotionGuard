# ADR 0003: Caller-owned browser, isolated context per capture

- Status: Accepted
- Date: 2026-07-11

## Decision

`@motionguard/playwright` accepts a caller-owned Playwright `Browser`, creates exactly one fresh `BrowserContext` per capture, and always closes that context. The adapter never closes the caller-owned browser.

The package uses `playwright-core` as a peer dependency and keeps browser installation/launch ownership outside the adapter. Development and E2E validation use Playwright 1.61.1.

## Security defaults

- Only loopback HTTP(S) URLs are allowed by default.
- Remote URLs require an exact origin allowlist entry.
- Downloads are disabled, CSP remains enforced, and service workers are blocked.
- Every configured selector must match exactly one element before capture.
- Sampling interval, duration, target count, strings, and output trace size are bounded.
- No page-provided string is executed as JavaScript or a shell command.

## Lifecycle

The adapter treats action failure, timeout, abort, page crash, page close, and browser disconnect as terminal. It removes lifecycle listeners and closes the context in `finally` so pages and artifacts cannot leak between runs.

## Consequences

Consumers must install a compatible Playwright implementation and explicitly launch a browser. The future CLI may own browser installation and launch, but core and this adapter remain separately testable. Multi-pointer correlation is intentionally deferred because the current core interaction contract does not yet store pointer IDs.
