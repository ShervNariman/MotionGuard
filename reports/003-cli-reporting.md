# Report 003 — CLI and reporting workflow

## Outcome

MotionGuard now has a prerelease command-line workflow that turns bounded JSON scenarios into isolated Chromium captures, deterministic findings, CI exit codes, and sanitized JSON, JUnit, and self-contained HTML reports.

## What shipped

- `motionguard init` creates a starter configuration without overwriting files.
- `motionguard check` loads and validates JSON, runs configured scenarios, evaluates all four core rules, writes selected reports, and returns deterministic exit codes.
- Declarative actions are limited to click, hover, press, and bounded wait operations. Configuration cannot execute JavaScript or shell commands.
- Output directories must be child directories of the current workspace.
- JSON line separators, XML entities, and HTML content are escaped. HTML output includes a restrictive Content Security Policy.
- Browser-backed CLI validation checks real Chromium capture and verifies all three generated report files.

## Five QA loops

1. **Requirements:** command behavior, configuration bounds, output formats, exit codes, and security constraints were traced to implementation and tests.
2. **Static quality:** canonical Biome formatting and lint, strict TypeScript, index-signature discipline, and explicit workspace package resolution.
3. **Automated behavior:** core, Playwright, reporter, and CLI unit tests; malformed configuration, overwrite protection, ambiguous options, hostile report strings, and bounded waits.
4. **Adversity and experience:** real Chromium execution against a local fixture; adapter lifecycle/security matrix; report-file verification; ESM and CJS package builds.
5. **Release readiness:** frozen lockfile, package builds, consumer checks, CodeQL, exact-head CI, Browser E2E, QA Agent review, and Senior Code Health review required before merge.

## Defects found and corrected

- Stale dependency lockfile after adding Playwright and reporter dependencies.
- Unbounded declarative waits.
- Unknown and duplicate CLI arguments were silently tolerated.
- Workspace package resolution failed in isolated typechecking and tests.
- The executable used top-level await, breaking the declared CJS build.
- Unit test discovery accidentally included browser tests without installed browser binaries.
- Output-path validation was strengthened using path-relative containment rather than string-prefix checks.

## Capability boundary

This milestone provides a usable prerelease CLI for explicitly configured scenarios. It does not yet include framework-specific presets, automatic target discovery, broad cross-browser support, hosted reports, or a stable `1.0` configuration contract.

## Next milestone

Version 4 should add polished examples and integration recipes, CI templates, report usability refinements, and release-candidate documentation without expanding the trusted execution surface.
