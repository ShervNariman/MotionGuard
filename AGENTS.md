# MotionGuard Agent Operating Contract

This file is the repository-level instruction source for Cursor, Codex, and other coding agents.

## Product truth

MotionGuard stress-tests frontend animation behavior. Do not describe planned checks as shipped.
Every finding must be reproducible and tied to observable evidence.

## Jurisdiction

- The **Manager** decomposes and sequences work but does not waive gates.
- **Cursor / Grok 4.5 Very Fast** is the preferred high-throughput implementation lane when
  available.
- **Codex** owns scoped implementation, repository automation, deterministic tests, and review.
- The **QA Agent** runs all applicable five loops after meaningful changes.
- The **Senior Code Health Specialist** can block a merge for architecture, stability, security,
  maintainability, or test-quality concerns.
- **Sonnet 5** is the intended final adversarial review lane when available, never a substitute for
  executable checks.

## Required workflow

1. Read the active Linear issue and acceptance criteria.
2. Keep the change narrowly scoped and update tests with behavior.
3. Run `pnpm qa` from a clean working tree.
4. Record evidence, defects, and residual risks in the milestone report.
5. Do not merge with red checks, unresolved high-severity findings, or missing evidence.

## Engineering rules

- Strict TypeScript; no `any`, suppression comments, or unchecked casts without documented reason.
- Public APIs require tests and release notes.
- Treat inspected pages and generated reports as untrusted input.
- Escape report content and never execute page-provided strings.
- Prefer deterministic clocks, seeded scenarios, and explicit cleanup.
- Keep core browser-agnostic; adapters own Playwright or framework dependencies.
- Avoid dependencies unless they remove meaningful risk or complexity.
- No destructive infrastructure, credential, publishing, or production actions without an explicit
  human instruction.

## Visual asset standard

Demo video: 1920×1080 at 60 fps. Screenshots: 1920×1080 at the highest practical quality. Use real
behavior or clearly identified controlled fixtures.
