# @motionguard/core

Browser-agnostic trace contracts and deterministic motion rules for MotionGuard.

> Prerelease API: the trace schema and thresholds may change before the first stable release.

## What is implemented

- Bounded, versioned, deeply immutable motion traces.
- Stable target identity checks and monotonic time validation.
- Deterministic finding IDs, evidence windows, severity, confidence, and remediation guidance.
- Four conservative rules:
  - moving interaction target;
  - interrupted-state mismatch;
  - exited-but-interactive element;
  - reduced-motion mismatch.

The package evaluates normalized observations. It does **not** launch a browser or inspect a page by itself; that belongs to the Playwright adapter milestone.

## Example

```ts
import {
  defineMotionGuardTrace,
  evaluateMotionGuardTrace,
} from "@motionguard/core";

const trace = defineMotionGuardTrace({
  schemaVersion: "0.1",
  scenarioId: "moving-button",
  reducedMotion: "no-preference",
  durationMs: 100,
  frames: [
    {
      atMs: 0,
      targets: [
        {
          id: "save-button",
          selector: "#save",
          connected: true,
          rect: { x: 0, y: 0, width: 100, height: 40 },
          visual: {
            display: "block",
            visibility: "visible",
            opacity: 1,
            pointerEvents: "auto",
            transform: "none",
          },
          accessibility: {
            focusable: true,
            focused: false,
            ariaHidden: false,
            ariaExpanded: null,
          },
          state: { declared: null, phase: "idle" },
          motionIntent: "unknown",
        },
      ],
    },
    {
      atMs: 100,
      targets: [
        {
          id: "save-button",
          selector: "#save",
          connected: true,
          rect: { x: 24, y: 0, width: 100, height: 40 },
          visual: {
            display: "block",
            visibility: "visible",
            opacity: 1,
            pointerEvents: "auto",
            transform: "matrix(1, 0, 0, 1, 24, 0)",
          },
          accessibility: {
            focusable: true,
            focused: false,
            ariaHidden: false,
            ariaExpanded: null,
          },
          state: { declared: null, phase: "idle" },
          motionIntent: "unknown",
        },
      ],
    },
  ],
  interactions: [
    {
      id: "pointer-down-1",
      atMs: 0,
      type: "pointer-down",
      targetId: "save-button",
      point: { x: 50, y: 20 },
      key: null,
      stateValue: null,
    },
    {
      id: "pointer-up-1",
      atMs: 100,
      type: "pointer-up",
      targetId: "save-button",
      point: { x: 50, y: 20 },
      key: null,
      stateValue: null,
    },
  ],
});

const result = evaluateMotionGuardTrace(trace);
console.log(result.passed); // false
console.log(result.findings[0]?.ruleId); // moving-interaction-target
```

See [`docs/rules/initial-rules.md`](../../docs/rules/initial-rules.md) for exact signals, defaults, and limitations.
