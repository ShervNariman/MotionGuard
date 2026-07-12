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

MotionGuard is in active prerelease development. The deterministic trace engine and four initial
rules are implemented. The Playwright adapter records explicitly configured targets in an isolated
browser context; the complete end-to-end CLI and polished report UI remain upcoming milestones.

## Packages

- `@motionguard/core` — bounded trace contracts and deterministic motion rules.
- `@motionguard/playwright` — isolated real-browser capture for explicitly configured targets.
- `@motionguard/cli` — command-line entry point under active development.
- `@motionguard/reporter` — sanitized machine-readable report generation.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm qa
```

Node.js 22 or newer is required.

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
