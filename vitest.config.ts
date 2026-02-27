import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["tests/setup/vitest.setup.ts"],
    clearMocks: true,
  },
  coverage: {
    provider: "v8",
    include: ["src/**/*.{ts,tsx}"],
  },
});
