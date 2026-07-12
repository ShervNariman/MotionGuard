# Sherv OS Adoption

Status: adopted
Control plane: ShervNariman/AI_LAB
Operational truth: Linear
Technical truth: GitHub
Executive brain: ChatGPT
Primary editor: Cursor
Background executor: Codex

## Required operating rules
- Read project documentation and linked Linear context before changing code.
- Use one bounded owner per task; avoid overlapping agent edits.
- Work on branches and submit reviewable pull requests.
- Run existing lint, typecheck, test, build, and integration checks.
- Never expose secrets or user content in prompts, logs, analytics, issues, or traces.
- Production, publishing, spending, destructive actions, auth changes, and sensitive writes require human approval.
- Capture release evidence and durable decisions.

## Adoption audit
A repository is compliant when this file exists, agent instructions are present, CI is healthy, Linear is linked or explicitly not required, and release boundaries are documented.
