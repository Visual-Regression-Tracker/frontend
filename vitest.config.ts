import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["src/setupTests.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      clearMocks: true,
      // typing into MUI fields is slow under a loaded CI runner
      testTimeout: 15_000,
      server: {
        deps: {
          // its ESM build imports "@mui/material/styles" as a directory, which Node refuses; Vite transforming it fixes that
          inline: [/@mui\/x-data-grid/],
        },
      },
      restoreMocks: true,
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx,js,jsx}"],
        exclude: [
          "src/**/*.test.*",
          "src/_test/**",
          "src/types/**",
          "src/**/*.d.ts",
        ],
        reporter: ["text-summary", "html", "json-summary"],
        // a ratchet: raise these when tests are added, never lower them
        thresholds: {
          statements: 88,
          branches: 79,
          functions: 86,
          lines: 88,
        },
      },
    },
  }),
);
