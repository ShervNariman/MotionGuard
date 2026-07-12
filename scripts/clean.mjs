import { rm } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

const cwd = process.cwd();
const targets = process.argv.slice(2);

if (targets.length === 0) {
  throw new Error("At least one cleanup target is required.");
}

for (const target of targets) {
  const resolved = resolve(cwd, target);
  const relativeTarget = relative(cwd, resolved);
  const escapesWorkspace =
    relativeTarget === ".." || relativeTarget.startsWith(`..${sep}`) || isAbsolute(relativeTarget);

  if (relativeTarget.length === 0 || escapesWorkspace) {
    throw new Error(`Refusing to remove path outside the current workspace: ${target}`);
  }

  await rm(resolved, { recursive: true, force: true });
}
