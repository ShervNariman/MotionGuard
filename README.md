# MotionGuard

> Break your animations before users do.

MotionGuard is an open-source animation stress-testing toolkit for catching interrupted
transitions, stuck states, moving interaction targets, exited-but-interactive elements, and
reduced-motion issues before they ship.

## Why MotionGuard

Most visual regression tools freeze motion to make screenshots deterministic. MotionGuard tests
the motion itself under hostile-but-realistic conditions: rapid toggles, mid-transition reversals,
viewport changes, focus movement, page lifecycle changes, and reduced-motion preferences.

## Repository status

MotionGuard is in active production development. The current repository establishes the strict
workspace, public package boundaries, deterministic five-loop QA gate, CI, security policy, and
agent governance used for all subsequent implementation. The browser stress engine, production CLI,
report viewer, and integrations are not shipped yet.

## Packages

- `@motionguard/core` — shared contracts and deterministic configuration primitives.
- `@motionguard/cli` — prerelease command-line boundary with truthful help/version output.
- `@motionguard/reporter` — prerelease sanitized machine-readable serialization boundary.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm qa
```

The release gate repeats the complete quality pass five times:

```bash
pnpm qa:repeat
```

Node.js 22.12.0 or newer is required.

## Governance

Every major change must pass five loops before merge:

1. Requirements and acceptance criteria.
2. Static quality and type safety.
3. Automated behavior and regression testing.
4. Accessibility, responsive, and adversarial interaction review.
5. Senior engineering and release-readiness review.

See [`AGENTS.md`](./AGENTS.md) and [`.ai-os/operating-manual.md`](./.ai-os/operating-manual.md).

## License

MIT © Sherv Nariman
