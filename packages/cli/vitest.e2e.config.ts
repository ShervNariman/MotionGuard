import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/e2e/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
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
