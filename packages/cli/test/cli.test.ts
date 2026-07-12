import { describe, expect, it, vi } from "vitest";
import { runCli } from "../src/index.js";

function createIo() {
  return {
    stdout: vi.fn<(message: string) => void>(),
    stderr: vi.fn<(message: string) => void>(),
  };
}

describe("runCli", () => {
  it("prints help without claiming the engine is shipped", () => {
    const io = createIo();
    expect(runCli([], io)).toBe(0);
    expect(io.stdout).toHaveBeenCalledWith(expect.stringContaining("coming in the core-engine"));
  });

  it("returns a failure for an unknown command", () => {
    const io = createIo();
    expect(runCli(["unknown"], io)).toBe(1);
    expect(io.stderr).toHaveBeenCalledWith("Unknown command: unknown");
  });
});
