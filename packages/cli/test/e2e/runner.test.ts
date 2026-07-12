import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeMotionGuard } from "../../src/runner.js";

let server: Server;
let baseUrl = "";
const directories: string[] = [];

beforeEach(async () => {
  server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      `<!doctype html><html><body><button data-target>Stable target</button></body></html>`,
    );
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (address === null || typeof address === "string")
    throw new Error("Could not resolve fixture port.");
  baseUrl = `http://127.0.0.1:${String(address.port)}`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("executeMotionGuard", () => {
  it("runs Chromium capture and writes JSON, JUnit, and HTML reports", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "motionguard-cli-e2e-"));
    directories.push(cwd);
    const report = await executeMotionGuard(
      {
        schemaVersion: "0.1",
        outputDir: ".motionguard",
        includeTrace: false,
        scenarios: [
          {
            id: "stable-target",
            url: baseUrl,
            viewport: { width: 800, height: 600 },
            reducedMotion: "no-preference",
            targets: [
              {
                id: "target",
                selector: "[data-target]",
                motionIntent: "unknown",
              },
            ],
            actions: [{ type: "wait", ms: 30 }],
          },
        ],
      },
      { cwd, now: () => new Date("2026-07-12T00:00:00.000Z") },
    );

    expect(report.passed).toBe(true);
    expect(report.scenarioCount).toBe(1);
    expect(report.findingCount).toBe(0);

    const output = join(cwd, ".motionguard");
    const json = JSON.parse(await readFile(join(output, "report.json"), "utf8")) as {
      passed: boolean;
      scenarioCount: number;
    };
    expect(json).toMatchObject({ passed: true, scenarioCount: 1 });
    expect(await readFile(join(output, "report.junit.xml"), "utf8")).toContain("testsuite");
    expect(await readFile(join(output, "report.html"), "utf8")).toContain("MotionGuard report");
  });
});
