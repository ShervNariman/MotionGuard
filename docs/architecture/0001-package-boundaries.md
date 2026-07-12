# ADR 0001: Package boundaries

- Status: Accepted
- Date: 2026-07-11

## Decision

MotionGuard begins as a pnpm TypeScript workspace with three stable boundaries:

- `core`: browser- and framework-agnostic contracts, scenarios, samples, rules, and findings.
- `cli`: orchestration, configuration loading, filesystem boundaries, and process UX.
- `reporter`: sanitized serialization and presentation of completed runs.

Browser automation and framework adapters will be added as separate packages rather than imported
into core.

## Rationale

This keeps the rule engine deterministic and unit-testable, prevents Playwright or framework
coupling from leaking into public contracts, and gives reporters an explicit untrusted-data
boundary.

## Consequences

Cross-package types originate in core. CLI and reporter may depend on core; core may not depend on
them. Cycles are prohibited.
