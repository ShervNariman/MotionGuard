import { readFile } from "node:fs/promises";

const coreTypes = await readFile("packages/core/src/types.ts", "utf8");
for (const contract of ["reducedMotion", "viewport", "interaction"]) {
  if (!coreTypes.includes(contract)) {
    throw new Error(`Core contract is missing experience dimension: ${contract}`);
  }
}
console.log("Verified accessibility, responsive, and interaction dimensions in core contracts.");
