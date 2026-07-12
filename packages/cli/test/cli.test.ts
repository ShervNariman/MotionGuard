import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseCliConfig, runCli } from "../src/index.js";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

function createIo() {
  return {
    stdout: vi.fn<(message: string) => void>(),
    stderr: vi.fn<(message: string) => void>(),
  };
}

describe("runCli", () => {
  it("prints current help and exit-code semantics", async () => {
    const io = createIo();
    await expect(runCli([], io)).resolves.toBe(0);
    expect(io.stdout).toHaveBeenCalledWith(expect.stringContaining("motionguard check"));
    expect(io.stdout).toHaveBeenCalledWith(expect.stringContaining("Motion findings detected"));
  });

  it("returns configuration failure for an unknown command", async () => {
    const io = createIo();
    await expect(runCli(["unknown"], io)).resolves.toBe(2);
    expect(io.stderr).toHaveBeenCalledWith("Unknown command: unknown");
  });

  it.each([
    [["check", "--wat"], "Unknown option: --wat"],
    [["check", "--format", "json", "--format", "html"], "--format may only be provided once."],
    [["init", "one.json", "two.json"], "Unknown argument: two.json"],
  ] as const)("rejects ambiguous arguments", async (args, message) => {
    const io = createIo();
    await expect(runCli(args, io)).resolves.toBe(2);
    expect(io.stderr).toHaveBeenCalledWith(message);
  });

  it("creates a starter config without overwriting files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "motionguard-cli-"));
    directories.push(directory);
    const path = join(directory, "motionguard.config.json");
    const io = createIo();
    await expect(runCli(["init", path], io)).resolves.toBe(0);
    expect(JSON.parse(await readFile(path, "utf8"))).toMatchObject({ schemaVersion: "0.1" });
    await expect(runCli(["init", path], io)).resolves.toBe(2);
  });
});

describe("parseCliConfig", () => {
  const base = {
    schemaVersion: "0.1",
    outputDir: ".motionguard",
    scenarios: [
      {
        id: "demo",
        url: "http://127.0.0.1:3000",
        viewport: { width: 1280, height: 720 },
        reducedMotion: "no-preference",
        targets: [{ id: "button", selector: "button", motionIntent: "unknown" }],
      },
    ],
  };

  it("freezes a bounded action configuration", () => {
    const config = parseCliConfig({
      ...base,
      scenarios: [{ ...base.scenarios[0], actions: [{ type: "wait", ms: 20 }] }],
    });
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.scenarios)).toBe(true);
    expect(config.scenarios[0]?.actions?.[0]).toEqual({ type: "wait", ms: 20 });
  });

  it.each([
    ["schema", { ...base, schemaVersion: "1" }],
    ["actions", { ...base, scenarios: [{ ...base.scenarios[0], actions: [{ type: "eval" }] }] }],
    ["empty scenarios", { ...base, scenarios: [] }],
    [
      "unbounded wait",
      { ...base, scenarios: [{ ...base.scenarios[0], actions: [{ type: "wait", ms: 60_001 }] }] },
    ],
  ])("rejects invalid %s", (_name, value) => {
    expect(() => parseCliConfig(value)).toThrow(TypeError);
  });
});
