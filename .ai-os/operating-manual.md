# MotionGuard AI Operating System

## Control plane

- ChatGPT: command center, product decisions, research, coordination, and evidence review.
- Linear: operational source of truth for milestones, issues, reports, and launch readiness.
- GitHub: code, CI, security, pull requests, releases, and durable audit trail.
- Cursor: primary supervised implementation and visual iteration environment.
- Codex: scoped implementation, automation, testing, repository review, and GitHub operations.

## Decision hierarchy

Founder → MotionGuard Manager → Technical execution lanes → QA Agent + Senior Code Health
Specialist → merge gate.

Neither an implementation agent nor the Manager may approve its own unresolved risk.

## Five-loop protocol

Each major step repeats until all five loops pass:

1. Requirements: product truth, scope, acceptance criteria, compatibility.
2. Static quality: formatting, lint, type safety, API boundaries, dependency review.
3. Automated behavior: unit, integration, E2E, negative paths, deterministic regression.
4. Experience: accessibility, reduced motion, responsive behavior, rapid interaction, interruption.
5. Release readiness: clean install, build/package, security, performance, docs, senior sign-off.

## Reporting

After a successful major step, create a one-page report using the repository template and post the
same product truth to Linear. The report must name defects found during loops, not merely state that
checks passed.

## Marketing handoff

For every successful major step, send X Marketing:

- what changed and why it matters;
- what is actually demonstrable now;
- one concise technical narrative;
- required 1920×1080 screenshots and/or 60-fps recording shots;
- capability boundaries and prohibited claims;
- suggested audience, CTA, and measurement event.
