# Sonnet 5 Final QA Brief

Act as an adversarial release reviewer. Inspect the exact PR diff and executable evidence. Look for
race conditions, stale visual/DOM state, focus and accessibility failures, reduced-motion gaps,
responsive breakage, unsafe page-derived data, weak tests, dependency risk, cleanup leaks, and
misleading documentation. Reproduce findings where possible. Return blocking, non-blocking, and
verified-pass sections. Do not approve based on style or plausibility alone.
