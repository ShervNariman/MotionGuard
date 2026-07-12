import { describe, expect, it } from "vitest";
import {
  defineMotionGuardReport,
  renderHtmlReport,
  serializeJsonReport,
  serializeJUnitReport,
} from "../src/index.js";

const finding = {
  id: "moving:test:button:0",
  ruleId: "moving-interaction-target" as const,
  severity: "error" as const,
  confidence: "high" as const,
  targetId: "button<script>",
  title: "Target <moved>",
  message: "Moved & escaped",
  remediation: "Keep the target still.",
  evidence: {
    startMs: 0,
    endMs: 100,
    frameIndexes: [0, 1],
    interactionIds: ["down", "up"],
    metrics: { distancePx: 24 },
  },
};

const report = defineMotionGuardReport(
  [
    {
      id: "scenario<script>",
      url: "http://localhost:3000/?q=<script>",
      passed: false,
      durationMs: 100,
      frameCount: 2,
      interactionCount: 2,
      findings: [finding],
    },
  ],
  "2026-07-11T00:00:00.000Z",
);

describe("report serialization", () => {
  it("produces stable JSON", () => {
    expect(serializeJsonReport(report)).toContain('"findingCount": 1');
  });

  it("escapes untrusted strings in JUnit XML", () => {
    const xml = serializeJUnitReport(report);
    expect(xml).toContain("scenario&lt;script&gt;");
    expect(xml).not.toContain("<script>");
  });

  it("renders a self-contained CSP-protected HTML report", () => {
    const html = renderHtmlReport(report);
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("Target &lt;moved&gt;");
    expect(html).not.toContain("<script>");
  });

  it("rejects invalid generated timestamps", () => {
    expect(() => defineMotionGuardReport([], "not-a-date")).toThrow(TypeError);
  });
});
