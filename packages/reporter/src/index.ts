import type { MotionGuardFinding, MotionGuardTrace } from "@motionguard/core";

export type MotionGuardScenarioReport = Readonly<{
  id: string;
  url: string;
  passed: boolean;
  durationMs: number;
  frameCount: number;
  interactionCount: number;
  findings: readonly MotionGuardFinding[];
  trace?: MotionGuardTrace;
}>;

export type MotionGuardReport = Readonly<{
  schemaVersion: "0.1";
  generatedAt: string;
  passed: boolean;
  scenarioCount: number;
  findingCount: number;
  scenarios: readonly MotionGuardScenarioReport[];
}>;

function escapeJsonLineSeparators(value: string): string {
  return value.replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value: string): string {
  return escapeXml(value);
}

export function defineMotionGuardReport(
  scenarios: readonly MotionGuardScenarioReport[],
  generatedAt = new Date().toISOString(),
): MotionGuardReport {
  if (!Number.isFinite(Date.parse(generatedAt))) {
    throw new TypeError("generatedAt must be an ISO-compatible timestamp.");
  }
  const normalized = Object.freeze(
    scenarios.map((scenario) =>
      Object.freeze({
        ...scenario,
        findings: Object.freeze([...scenario.findings]),
      }),
    ),
  );
  const findingCount = normalized.reduce((total, scenario) => total + scenario.findings.length, 0);
  return Object.freeze({
    schemaVersion: "0.1",
    generatedAt,
    passed: normalized.every((scenario) => scenario.passed),
    scenarioCount: normalized.length,
    findingCount,
    scenarios: normalized,
  });
}

export function serializeJsonReport(report: MotionGuardReport): string {
  return escapeJsonLineSeparators(JSON.stringify(report, null, 2));
}

export function serializeJUnitReport(report: MotionGuardReport): string {
  const failures = report.scenarios.filter((scenario) => !scenario.passed).length;
  const cases = report.scenarios
    .map((scenario) => {
      const failure = scenario.passed
        ? ""
        : `<failure message="${escapeXml(`${scenario.findings.length} motion finding(s)`)}">${escapeXml(
            scenario.findings
              .map(
                (finding) =>
                  `[${finding.severity}] ${finding.ruleId}: ${finding.message} Remediation: ${finding.remediation}`,
              )
              .join("\n"),
          )}</failure>`;
      return `<testcase classname="MotionGuard" name="${escapeXml(scenario.id)}" time="${(
        scenario.durationMs / 1_000
      ).toFixed(3)}">${failure}</testcase>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites tests="${report.scenarioCount}" failures="${failures}"><testsuite name="MotionGuard" tests="${report.scenarioCount}" failures="${failures}">${cases}</testsuite></testsuites>\n`;
}

export function renderHtmlReport(report: MotionGuardReport): string {
  const scenarioMarkup = report.scenarios
    .map((scenario) => {
      const findings =
        scenario.findings.length === 0
          ? '<p class="empty">No motion findings.</p>'
          : `<ol>${scenario.findings
              .map(
                (finding) => `<li>
  <div class="finding-head"><strong>${escapeHtml(finding.title)}</strong><span>${escapeHtml(
    finding.severity,
  )} · ${escapeHtml(finding.confidence)}</span></div>
  <p>${escapeHtml(finding.message)}</p>
  <p class="remediation"><strong>Fix:</strong> ${escapeHtml(finding.remediation)}</p>
  <code>${escapeHtml(finding.ruleId)} · ${escapeHtml(finding.targetId)} · ${finding.evidence.startMs.toFixed(
    1,
  )}–${finding.evidence.endMs.toFixed(1)} ms</code>
</li>`,
              )
              .join("")}</ol>`;
      return `<section class="scenario ${scenario.passed ? "pass" : "fail"}">
<header><div><h2>${escapeHtml(scenario.id)}</h2><p>${escapeHtml(scenario.url)}</p></div><span class="status">${
        scenario.passed ? "PASS" : "FINDINGS"
      }</span></header>
<div class="metrics"><span>${scenario.durationMs.toFixed(0)} ms</span><span>${scenario.frameCount} frames</span><span>${
        scenario.findings.length
      } findings</span></div>${findings}</section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
<title>MotionGuard report</title><style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#090c10;color:#f5f7fa}*{box-sizing:border-box}body{margin:0}main{width:min(1100px,calc(100% - 32px));margin:48px auto 96px}.eyebrow{color:#8d98a5;text-transform:uppercase;letter-spacing:.12em;font-size:12px}h1{font-size:clamp(36px,7vw,68px);margin:10px 0}.summary{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0 42px}.summary span,.metrics span{background:#171d25;border:1px solid #29323d;border-radius:999px;padding:8px 13px}.scenario{background:#11161d;border:1px solid #29323d;border-radius:22px;padding:24px;margin:18px 0}.scenario.pass{border-color:#215c43}.scenario.fail{border-color:#713a36}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}h2{margin:0;font-size:24px}header p{margin:8px 0;color:#9ca6b2;overflow-wrap:anywhere}.status{font-size:12px;font-weight:800;letter-spacing:.08em;padding:8px 11px;border-radius:999px;background:#202833}.pass .status{color:#54df9c}.fail .status{color:#ff8877}.metrics{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.metrics span{font-size:12px;padding:6px 10px}ol{padding-left:22px}li{padding:16px 0;border-top:1px solid #29323d}.finding-head{display:flex;justify-content:space-between;gap:18px}.finding-head span,code{color:#9ca6b2;font-size:12px}.remediation{color:#d5dbe2}.empty{color:#54df9c}@media(max-width:650px){header,.finding-head{display:block}.status{display:inline-block;margin-top:12px}}
</style></head><body><main><p class="eyebrow">MotionGuard · ${escapeHtml(report.generatedAt)}</p><h1>${
    report.passed ? "Motion checks passed" : "Motion findings detected"
  }</h1><div class="summary"><span>${report.scenarioCount} scenarios</span><span>${
    report.findingCount
  } findings</span><span>${report.passed ? "PASS" : "FAIL"}</span></div>${scenarioMarkup}</main></body></html>\n`;
}
