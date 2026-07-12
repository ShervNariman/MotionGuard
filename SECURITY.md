# Security Policy

## Supported versions

MotionGuard has not published a stable release yet. Security fixes apply to the default branch and
the latest prerelease.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability
reporting for this repository. Include reproduction steps, affected versions, impact, and any
suggested mitigation.

## Threat model baseline

MotionGuard may inspect untrusted pages and serialize page-derived data. Implementations must:

- avoid evaluating page-provided code or command strings;
- sanitize HTML reports and file names;
- constrain filesystem writes to explicit output directories;
- redact secrets and sensitive headers;
- isolate browser contexts;
- limit trace size, duration, concurrency, and network behavior;
- clean up listeners, timers, contexts, and temporary files on success and failure.
