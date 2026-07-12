# ADR 0002: Immutable traces and browser-agnostic rules

- Status: Accepted
- Date: 2026-07-11

## Decision

MotionGuard represents browser observations as a bounded, versioned, deeply immutable trace. Rule evaluation consumes only this core trace model and may not import Playwright or framework APIs.

The initial evaluator ships four conservative rules: moving interaction target, interrupted-state mismatch, exited-but-interactive element, and reduced-motion mismatch.

## Rationale

Separating observation from evaluation makes findings deterministic, replayable, testable without a browser, and suitable for multiple future adapters. Bounded traces also limit memory and report-size risk when inspected pages are untrusted.

## Consequences

Adapters must normalize browser data into the core schema, declare motion intent explicitly for reduced-motion checks, and preserve monotonic timestamps. Rules must document thresholds and avoid broad compliance claims.
