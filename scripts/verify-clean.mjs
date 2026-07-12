import { spawnSync } from "node:child_process";
import { access, mkdir, rm, writeFile } from "node:fs/promises";

const fixture = ".motionguard/clean-verification";
await rm(".motionguard", { recursive: true, force: true });
await mkdir(fixture, { recursive: true });
await writeFile(`${fixture}/proof.txt`, "safe to remove\n", "utf8");

const allowed = spawnSync(process.execPath, ["scripts/clean.mjs", fixture], {
  encoding: "utf8",
});
if (allowed.status !== 0) {
  throw new Error(`In-workspace cleanup failed: ${allowed.stderr || allowed.stdout}`);
}

try {
  await access(fixture);
  throw new Error("In-workspace cleanup target still exists.");
} catch (error) {
  if (error instanceof Error && error.message === "In-workspace cleanup target still exists.") {
    throw error;
  }
}

const refused = spawnSync(process.execPath, ["scripts/clean.mjs", ".."], {
  encoding: "utf8",
});
if (refused.status === 0 || !refused.stderr.includes("Refusing to remove path outside")) {
  throw new Error("Out-of-workspace cleanup was not refused.");
}

await rm(".motionguard", { recursive: true, force: true });
console.log("Verified guarded cleanup success and workspace-boundary refusal.");
