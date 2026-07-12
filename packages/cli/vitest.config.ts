import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/cli.test.ts"],
  },
  resolve: {
    alias: {
      "@motionguard/core": fileURLToPath(new URL("../core/src/index.ts", import.meta.url)),
      "@motionguard/playwright": fileURLToPath(
        new URL("../playwright/src/index.ts", import.meta.url),
      ),
      "@motionguard/reporter": fileURLToPath(new URL("../reporter/src/index.ts", import.meta.url)),
    },
  },
});
