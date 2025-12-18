import { defineConfig } from "@playwright/test";

const baseURL = "http://localhost:5173";

export default defineConfig({
  testDir: "integration_tests/test",
  fullyParallel: true,
  reporter: "html",
  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: true,
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
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
});
