# MotionGuard Version 4 Integration Readiness Plan

## Status

Version 4 is in progress. MotionGuard is not yet Version 5 or production-ready.

## Objective

Turn the Version 3 prerelease CLI into an integration-ready release candidate with stronger stability evidence, safer filesystem behavior, explicit compatibility rules, representative examples, and CI-consumer guidance.

## Required workstreams

1. **Repeated-run browser stability**
   - Reproduce and characterize the intermittent Playwright E2E first-attempt failure observed during the Version 3 gate.
   - Add bounded repeated-run coverage and preserve diagnostics without self-modifying workflows.
   - Define a documented stability threshold and fail consistently when it is exceeded.

2. **Lifecycle and failure cleanup**
   - Exercise action failure, timeout, page close, context close, browser disconnect, and interrupted-run paths.
   - Verify browser/context/page resources close and partial reports are not represented as successful output.

3. **Filesystem hardening**
   - Prevent output escape through symlinked child directories and unsafe existing output targets.
   - Keep all generated files workspace-constrained and deterministic.

4. **Schema compatibility**
   - Publish a clear prerelease compatibility policy for configuration and report schemas.
   - Reject unsupported schema versions with actionable diagnostics.
   - Add migration-oriented fixtures for compatible and incompatible inputs.

5. **Consumer integration**
   - Add a minimal representative example application and configuration.
   - Add documented GitHub Actions usage with deterministic exit-code behavior and uploaded reports.
   - Validate packed packages in a clean consumer fixture rather than relying only on workspace links.

6. **Performance and cross-platform expectations**
   - Add representative performance budgets for scenario count, report size, and repeated execution.
   - Document Linux CI as the primary verified environment and add practical path/line-ending coverage for Windows and macOS expectations.

## Mandatory gate

Every major change receives all five QA loops. Version 4 may merge only when CI, CodeQL, browser E2E, clean consumer/package checks, QA Agent review, and Senior Code Health review pass on the exact final head. A one-page Version 4 report must record evidence, limitations, and the reviewed commit SHA.

## Carried risks from Version 3

- Intermittent first-attempt Playwright E2E failure; controlled retry passed.
- Symlink-aware output containment is not yet proven.
- Timeout/crash/browser-disconnect cleanup coverage is incomplete.
- Cross-platform evidence is limited.
- Configuration/report schema compatibility policy remains prerelease-only.
