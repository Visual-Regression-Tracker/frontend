import { defineConfig } from "@playwright/test";

const baseURL = "http://localhost:4173";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "integration_tests/test",
  fullyParallel: true,
  // GitHub's ubuntu runners have 4 cores; the default would use only half
  workers: isCI ? 4 : undefined,
  reporter: "html",
  webServer: {
    // The production bundle, not the dev server: Vite transforms modules on
    // request in one process, which stalls the workers and caps the speed-up
    command: "npm run test:pw:serve",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  use: {
    headless: true,
    baseURL,
    actionTimeout: 5000,
    navigationTimeout: 5000,
    trace: "retry-with-trace",
    screenshot: "only-on-failure",
  },
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
    },
  },
  snapshotPathTemplate: "{testDir}/{testFileName}-snapshots/{arg}{ext}",
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
});
