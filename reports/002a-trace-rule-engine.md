# MotionGuard Major-Step Report 002A — Trace & Rule Engine

**Objective:** Build the deterministic, browser-agnostic evidence model and first four motion diagnostics before connecting a live browser.

## Shipped

- Versioned, bounded, deeply immutable traces with monotonic timestamps and stable target identity metadata.
- Normalized geometry, visual, accessibility, application-state, interaction, motion-intent, and reduced-motion evidence.
- Deterministic finding IDs, evidence windows, metrics, severity, confidence, and remediation.
- Four rules: moving interaction target, interrupted-state mismatch, exited-but-interactive, and reduced-motion mismatch.
- One shared trace index and binary-search frame lookup to avoid repeated full-trace scans.
- Public rule documentation with exact defaults, false-positive controls, and limitations.

## Five-loop evidence

1. **Requirements:** Core remains browser/framework agnostic and emits evidence rather than unsupported compliance claims.
2. **Static quality:** Biome and strict TypeScript pass without suppressions.
3. **Automated behavior:** 41 repository tests pass, including positive, negative, boundary, immutability, malformed input, stale-sample, reversal, false-positive, and five-repeat deterministic-output cases.
4. **Experience:** Viewport, pointer, focusability, application state, motion intent, and reduced-motion evidence are explicit in the trace contract.
5. **Release readiness:** Core builds as ESM/CommonJS and passes Publint plus Are The Types Wrong. Exact-head CI and CodeQL remain mandatory before merge.

## Defects found and fixed

Review corrected stale target reuse, generic state mismatches being mislabeled as interruptions, `aria-hidden` being treated as visual invisibility, pointer movement being blamed on a stable target, mutable/unstable target identity metadata, locale-sensitive finding ordering, and an inefficient repeated trace scan.

## Code-health status

The evaluator is deterministic and dependency-free. Trace size and string lengths are bounded; runtime values are validated; normalized traces and findings are immutable; rules share a precomputed index. The live browser adapter, lifecycle cleanup, and cross-browser evidence quality remain intentionally outside this increment.

## User value

A frontend tool or adapter can now submit a recorded motion trace and receive specific, reproducible findings instead of relying on final-frame screenshots or subjective review.

## X Marketing handoff

**Truthful narrative:** MotionGuard can now evaluate normalized motion traces and identify four classes of temporal UI defects in deterministic tests. It does not yet inspect a real webpage. Marketing proof should use controlled trace input/output and must not imply a live browser scan.

## Next step

Build the isolated Playwright adapter that records real targets into this trace schema, proves cleanup, and validates the rules against adversarial browser fixtures.
