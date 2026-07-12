# Initial MotionGuard Rules

MotionGuard rules are evidence-backed diagnostics, not broad accessibility or correctness certifications. Defaults are deliberately conservative and configurable through `defineRuleOptions`.

## Moving interaction target

**Signal:** the center of the activated target moves at least 8 px between pointer-down and pointer-up.

**Evidence:** the two target rectangles, pointer events, movement distance, pointer movement, and whether the release point falls outside the final rectangle.

**Does not flag:** a stationary target merely because the user drags or releases the pointer outside it.

**Known limitation:** viewport scrolling can move a target relative to the pointer and may be reported; the browser adapter should preserve scroll evidence for interpretation.

## Interrupted-state mismatch

**Signal:** two opposite state-change events occur within 300 ms, followed within 1,000 ms by at least 80 ms where the idle visual state disagrees with the latest declared open/closed state.

**Evidence:** both state-change events, the mismatching frame range, state-change gap, and mismatch duration.

**Does not flag:** a static state mismatch without evidence of a rapid reversal, or a target still marked as entering/exiting.

**Known limitation:** adapters must emit state-change events only for real application state changes and normalize the latest declared state accurately.

## Exited-but-interactive

**Signal:** a connected, visually hidden target remains focusable, focused, or pointer-active for at least 50 ms.

**Evidence:** the hidden frame range and the exact interactive signals that remain.

**Does not flag:** disconnected targets or hidden targets whose focus and pointer interaction are disabled.

**Known limitation:** the adapter is responsible for computing effective focusability, not merely reading `tabindex`.

## Reduced-motion mismatch

**Signal:** under `prefers-reduced-motion: reduce`, a target explicitly marked as non-essential moves more than 24 px from its first observed position.

**Evidence:** first and maximum-displacement frames, maximum distance, configured allowance, and motion intent.

**Does not judge:** essential or unknown motion. MotionGuard does not infer whether movement is essential.

**Known limitation:** this first rule uses spatial displacement; future versions may separately account for rotation, zoom, and velocity.
