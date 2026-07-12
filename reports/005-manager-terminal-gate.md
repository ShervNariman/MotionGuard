# MotionGuard Version 5 Manager Gate

## Purpose

The MotionGuard Manager now treats a fully completed, production-ready Version 5 as the only terminal project state. Version 3, Version 4, reports, demonstrations, green subsets, and release candidates remain intermediate progress.

## Enforced controls

- Five QA loops after every major change and on the exact final Version 5 commit.
- Independent QA Agent and Senior Code Health Specialist review.
- Exact-head CI, CodeQL, browser E2E, build, package, and consumer validation.
- Live roadmap and blocker ownership through Versions 3, 4, and 5.
- No temporary diagnostics, bootstrap files, unresolved release blockers, or unsupported product claims at completion.
- Security, accessibility-sensitive motion behavior, lifecycle cleanup, performance, repeated-run stability, documentation, examples, and package usability are part of the terminal gate.

## Current state

Version 3 remains in QA on PR #7. The project is not yet Version 5 and must not be described as complete or production-ready.

## Completion authority

The Manager may declare completion only after every condition in `.ai-os/roles/manager.md` passes on one immutable reviewed commit and the Version 5 report records the supporting evidence and commit SHA.
