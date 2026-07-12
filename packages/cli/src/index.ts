import { MOTIONGUARD_SCHEMA_VERSION } from "@motionguard/core";

const VERSION = "0.0.0";

export type CliIo = Readonly<{
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}>;

const defaultIo: CliIo = {
  stdout: (message) => console.log(message),
  stderr: (message) => console.error(message),
};

export function runCli(args: readonly string[], io: CliIo = defaultIo): number {
  if (args.includes("--version") || args.includes("-v")) {
    io.stdout(VERSION);
    return 0;
  }

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    io.stdout(
      `MotionGuard ${VERSION}\n\nUsage: motionguard <command>\n\nCommands:\n  check    Run configured animation stress checks (coming in the core-engine milestone)\n\nOptions:\n  -h, --help     Show help\n  -v, --version  Show version\n\nSchema: ${MOTIONGUARD_SCHEMA_VERSION}`,
    );
    return 0;
  }

  io.stderr(`Unknown command: ${args[0] ?? ""}`);
  return 1;
}
