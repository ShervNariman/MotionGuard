# @motionguard/cli

Command-line animation stress testing with MotionGuard.

> Prerelease: configuration and report schemas may change before the first stable release.

## Install

```bash
pnpm add -D @motionguard/cli
pnpm exec playwright install chromium
```

## Start a configuration

```bash
pnpm motionguard init
```

This creates `motionguard.config.json` without overwriting an existing file.

## Run checks

```bash
pnpm motionguard check
```

By default, MotionGuard writes sanitized reports to `.motionguard/`:

- `report.json`
- `report.junit.xml`
- `report.html`

Use `--format json`, `--format junit`, or `--format html` to emit only one format. Use `--output <child-directory>` to change the report directory. Output must remain inside the current working directory.

## Configuration

MotionGuard uses bounded JSON configuration rather than executable JavaScript. Supported actions are:

- `click` with a selector
- `hover` with a selector
- `press` with a selector and key
- `wait` between 1 ms and 60,000 ms

```json
{
  "schemaVersion": "0.1",
  "outputDir": ".motionguard",
  "includeTrace": false,
  "scenarios": [
    {
      "id": "dialog-reversal",
      "url": "http://127.0.0.1:3000/demo",
      "viewport": { "width": 1280, "height": 720 },
      "reducedMotion": "no-preference",
      "targets": [
        {
          "id": "dialog",
          "selector": "[data-dialog]",
          "motionIntent": "non-essential"
        }
      ],
      "actions": [
        { "type": "click", "selector": "[data-open]" },
        { "type": "wait", "ms": 40 },
        { "type": "click", "selector": "[data-close]" }
      ]
    }
  ]
}
```

Remote origins must be explicitly allowlisted through the scenario's `allowedOrigins` field. The browser adapter blocks non-allowlisted HTTP(S) requests, downloads, and service workers.

## Exit codes

- `0`: all configured scenarios passed
- `1`: deterministic motion findings were detected
- `2`: configuration, browser, or runtime failure

## Security boundary

The CLI does not evaluate configuration as code and does not execute shell commands. Page-derived strings are escaped in JUnit and HTML output. HTML reports are self-contained and include a restrictive Content Security Policy.
