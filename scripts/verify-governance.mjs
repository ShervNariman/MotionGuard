import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "AGENTS.md",
  ".ai-os/operating-manual.md",
  ".ai-os/roles/manager.md",
  ".ai-os/roles/qa-agent.md",
  ".ai-os/roles/senior-code-health-specialist.md",
  ".ai-os/templates/major-step-report.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
];

await Promise.all(requiredFiles.map((file) => access(file)));
const agents = await readFile("AGENTS.md", "utf8");
for (const phrase of ["five loops", "untrusted", "1920×1080"]) {
  if (!agents.toLowerCase().includes(phrase.toLowerCase())) {
    throw new Error(`AGENTS.md is missing required governance phrase: ${phrase}`);
  }
}

const manager = await readFile(".ai-os/roles/manager.md", "utf8");
for (const phrase of [
  "production-ready Version 5",
  "Version 5 terminal gate",
  "five-loop gate",
  "Senior Code Health Specialist",
  "exact final Version 5 head",
]) {
  if (!manager.toLowerCase().includes(phrase.toLowerCase())) {
    throw new Error(`Manager governance is missing required terminal-control phrase: ${phrase}`);
  }
}

console.log(`Verified ${requiredFiles.length} governance files and mandatory controls.`);
