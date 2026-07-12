import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MOTIONGUARD_SCHEMA_VERSION } from "@motionguard/core";
import { DEFAULT_CONFIG, loadCliConfig } from "./config.js";
import { executeMotionGuard, type MotionGuardOutputFormat } from "./runner.js";

const VERSION = "0.3.0";

export type CliIo = Readonly<{
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}>;

const defaultIo: CliIo = {
  stdout: (message) => console.log(message),
  stderr: (message) => console.error(message),
};

function help(): string {
  return `MotionGuard ${VERSION}\n\nUsage:\n  motionguard init [path]\n  motionguard check [options]\n\nCheck options:\n  -c, --config <path>     JSON config (default: motionguard.config.json)\n  -o, --output <dir>      Override output directory\n  -f, --format <format>   all | json | junit | html (default: all)\n\nExit codes:\n  0  No findings\n  1  Motion findings detected\n  2  Configuration or runtime failure\n\nGlobal options:\n  -h, --help              Show help\n  -v, --version           Show version\n\nSchema: ${MOTIONGUARD_SCHEMA_VERSION}`;
}

function optionValue(args: readonly string[], short: string, long: string): string | undefined {
  const indexes = args
    .map((arg, index) => (arg === short || arg === long ? index : -1))
    .filter((index) => index >= 0);
  if (indexes.length === 0) return undefined;
  if (indexes.length > 1) throw new TypeError(`${long} may only be provided once.`);
  const value = args[indexes[0]! + 1];
  if (value === undefined || value.startsWith("-")) {
    throw new TypeError(`${long} requires a value.`);
  }
  return value;
}

function validateCheckArgs(args: readonly string[]): void {
  const options = new Set(["-c", "--config", "-o", "--output", "-f", "--format"]);
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index]!;
    if (!options.has(arg)) throw new TypeError(`Unknown option: ${arg}`);
    const value = args[index + 1];
    if (value === undefined || value.startsWith("-"))
      throw new TypeError(`${arg} requires a value.`);
    index += 1;
  }
}

function parseFormat(value: string | undefined): MotionGuardOutputFormat {
  if (value === undefined) return "all";
  if (value === "all" || value === "json" || value === "junit" || value === "html") return value;
  throw new TypeError(`Unsupported format: ${value}.`);
}

export async function runCli(args: readonly string[], io: CliIo = defaultIo): Promise<number> {
  if (args.includes("--version") || args.includes("-v")) {
    io.stdout(VERSION);
    return 0;
  }
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    io.stdout(help());
    return 0;
  }

  try {
    const command = args[0];
    if (command === "init") {
      if (args.length > 2) throw new TypeError(`Unknown argument: ${args[2] ?? ""}`);
      const path = resolve(args[1] ?? "motionguard.config.json");
      try {
        await access(path);
        throw new TypeError(`Refusing to overwrite existing file: ${path}`);
      } catch (error) {
        if (error instanceof TypeError) throw error;
      }
      await writeFile(path, DEFAULT_CONFIG, { encoding: "utf8", flag: "wx" });
      io.stdout(`Created ${path}`);
      return 0;
    }
    if (command !== "check") {
      throw new TypeError(`Unknown command: ${command ?? ""}`);
    }

    validateCheckArgs(args);
    const configPath = optionValue(args, "-c", "--config") ?? "motionguard.config.json";
    const outputDir = optionValue(args, "-o", "--output");
    const format = parseFormat(optionValue(args, "-f", "--format"));
    const config = await loadCliConfig(configPath);
    const report = await executeMotionGuard(config, {
      format,
      ...(outputDir ? { outputDir } : {}),
    });
    io.stdout(
      `${report.passed ? "PASS" : "FINDINGS"}: ${report.scenarioCount} scenario(s), ${report.findingCount} finding(s).`,
    );
    return report.passed ? 0 : 1;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 2;
  }
}

export { loadCliConfig, parseCliConfig } from "./config.js";
export type {
  MotionGuardCliAction,
  MotionGuardCliConfig,
  MotionGuardCliScenario,
} from "./config.js";
export { executeMotionGuard } from "./runner.js";
