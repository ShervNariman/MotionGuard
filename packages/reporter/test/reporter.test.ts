import { describe, expect, it } from "vitest";
import { serializeRunSummary } from "../src/index.js";

describe("serializeRunSummary", () => {
  it("produces stable formatted JSON", () => {
    const output = serializeRunSummary({
      schemaVersion: "0.1",
      startedAt: "2026-07-11T00:00:00.000Z",
      completedAt: "2026-07-11T00:00:01.000Z",
      passed: true,
      scenarioCount: 1,
    });

    expect(output).toContain('"schemaVersion": "0.1"');
    expect(output.endsWith("}")).toBe(true);
  });
});
