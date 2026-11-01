import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

// Each worktree sets its own PW_PORT: Playwright reuses a server already on the port
const port = Number(process.env.PW_PORT ?? 4173);
const baseURL = `http://localhost:${port}`;
const isCI = !!process.env.CI;
// The large-build perf spec is its own project: it needs a quiet machine and minutes, so only PW_PERF=1 runs it
const perf = !!process.env.PW_PERF;
// The joint smoke drives the real backend stack, so only PW_E2E=1 runs it
const e2e = !!process.env.PW_E2E;
const defaultWorkers = isCI ? 4 : undefined;

const perfProject: NonNullable<PlaywrightTestConfig["projects"]>[number] = {
  name: "perf",
  testDir: "integration_tests/perf",
  testMatch: "**/*.perf.ts",
  // timings are only comparable when nothing else runs in the page's process
  fullyParallel: false,
  timeout: 180_000,
  use: { actionTimeout: 30_000, navigationTimeout: 30_000 },
};

const e2eProject: NonNullable<PlaywrightTestConfig["projects"]>[number] = {
  name: "e2e",
  testDir: "integration_tests/e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 60_000,
  // the API computes diffs and writes images: slower than a mocked answer
  use: { actionTimeout: 15_000, navigationTimeout: 15_000 },
  expect: { timeout: 15_000 },
};

function onlyProject() {
  if (perf) return [perfProject];
  if (e2e) return [e2eProject];
  return undefined;
}

export default defineConfig({
  testDir: "integration_tests/test",
  projects: onlyProject(),
  fullyParallel: true,
  // GitHub's ubuntu runners have 4 cores; the default would use only half
  workers: perf ? 1 : defaultWorkers,
  reporter: perf ? "list" : "html",
  webServer: {
    // The production bundle, not the dev server: Vite transforms modules in one process, which stalls the workers
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
