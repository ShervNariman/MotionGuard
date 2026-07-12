import { spawn } from "node:child_process";

const loops = [
  { name: "1/5 Requirements", command: "node", args: ["scripts/verify-governance.mjs"] },
  { name: "2/5 Static quality", command: "pnpm", args: ["format:check"] },
  { name: "2/5 Lint", command: "pnpm", args: ["lint"] },
  { name: "2/5 Type safety", command: "pnpm", args: ["typecheck"] },
  { name: "3/5 Automated behavior", command: "pnpm", args: ["test"] },
  {
    name: "4/5 Experience contract",
    command: "node",
    args: ["scripts/verify-experience-contract.mjs"],
  },
  { name: "5/5 Build", command: "pnpm", args: ["build"] },
  { name: "5/5 Package integrity", command: "pnpm", args: ["package:check"] },
];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: process.platform === "win32", stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${String(code)}`));
    });
  });
}

for (const loop of loops) {
  console.log(`\n=== ${loop.name} ===`);
  await run(loop.command, loop.args);
}

console.log("\nMotionGuard five-loop QA passed.");
