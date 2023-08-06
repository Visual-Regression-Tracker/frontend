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
    timeout: 300 * 1000,
  },
  use: {
    headless: true,
    baseURL,
    actionTimeout: 5000,
    navigationTimeout: 5000,
  },
  expect: {
    timeout: 10 * 1000,
  },
  forbidOnly: !!process.env.CI,
});
