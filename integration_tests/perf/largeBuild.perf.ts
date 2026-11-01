// not part of `playwright test`: run with PW_PERF=1 npx playwright test (CI job "perf")
import { expect, type CDPSession, type Page } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
} from "~client/_test/test.data.helper";
import { BuildStatus } from "~client/types/buildStatus";
import { TestStatus } from "~client/types";
import type { Build, TestRun } from "~client/types";
import {
  mockAllTestRunDetails,
  mockEveryImage,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
} from "utils/mocks";
import {
  emitSocketEvent,
  hasSocket,
  installReactProbe,
  readRenders,
  resetProbe,
  setCounting,
  waitForQuietCommits,
} from "./reactProbe";

const RUNS = Number(process.env.PERF_RUNS ?? 5000);
const THROTTLE = Number(process.env.PERF_THROTTLE ?? 4);
// a loaded machine measures 130-180 ms: fails on a several-fold slowdown, not noise
const RUN_UPDATE_LIMIT_MS = Number(process.env.PERF_UPDATE_LIMIT_MS ?? 400);

const project = TEST_PROJECT;
const build: Build = {
  ...TEST_BUILD_FAILED,
  id: "large-build",
  ciBuildId: "large-ci-build",
  status: BuildStatus.unresolved,
  unresolvedCount: RUNS / 7,
  passedCount: RUNS / 2,
  failedCount: 0,
  isRunning: true,
};

const STATUSES = [
  TestStatus.unresolved,
  TestStatus.new,
  TestStatus.ok,
  TestStatus.ok,
  TestStatus.ok,
  TestStatus.approved,
  TestStatus.failed,
];
const BROWSERS = ["chromium", "firefox", "webkit"];
const VIEWPORTS = ["1280x720", "375x812"];
const LOCALES = ["en", "de", "fr", "es"];

const testRuns: TestRun[] = Array.from({ length: RUNS }, (_, i) => {
  const status = STATUSES[i % STATUSES.length];
  return {
    id: `run-${i}`,
    buildId: build.id,
    imageName: `cur-${i}.png`,
    diffName: status === TestStatus.unresolved ? `diff-${i}.png` : null,
    baselineName: `base-${i}.png`,
    diffPercent: 1.2,
    diffTollerancePercent: 0,
    status,
    testVariationId: `tv-${i}`,
    name: `Screen ${Math.floor(i / 24)} / state ${i % 6}`,
    os: "linux",
    browser: BROWSERS[i % BROWSERS.length],
    viewport: VIEWPORTS[i % VIEWPORTS.length],
    device: "",
    customTags: LOCALES[i % LOCALES.length],
    ignoreAreas: "[]",
    tempIgnoreAreas: "[]",
    comment: "",
    branchName: build.branchName,
    baselineBranchName: build.branchName,
    merge: false,
  };
});

const approved = (run: TestRun): TestRun => ({
  ...run,
  status: TestStatus.approved,
});

async function taskSeconds(cdp: CDPSession) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return metrics.find((metric) => metric.name === "TaskDuration")?.value ?? 0;
}

async function openLargeBuild(page: Page, testId?: string) {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockGetTestRuns(page, build.id, testRuns);
  await mockAllTestRunDetails(page, testRuns);
  await mockEveryImage(page, "image.png");
  // no server listens for the socket; the probe delivers its events
  await page.route("**/socket.io/**", (route) => route.abort());
  await installReactProbe(page);

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });

  const run = testId ? `&testId=${testId}` : "";
  await page.goto(`/${project.id}?buildId=${build.id}${run}`);
  return cdp;
}

async function openList(page: Page) {
  const cdp = await openLargeBuild(page);
  await expect(page.locator(".MuiDataGrid-row").first()).toBeVisible({
    timeout: 60_000,
  });
  await expect.poll(() => hasSocket(page)).toBe(true);
  await waitForQuietCommits(page);
  return cdp;
}

async function deliver(page: Page, event: string, payloads: unknown[]) {
  await resetProbe(page);
  for (const payload of payloads) {
    await emitSocketEvent(page, event, payload);
  }
  await waitForQuietCommits(page);
  return readRenders(page);
}

test.describe("a build of thousands of runs", () => {
  test.beforeEach(({ authUser }) => authUser);

  test("a build update nobody sees renders nothing in the run list", async ({
    page,
  }) => {
    await openList(page);

    const elsewhere: Build[] = [
      { ...build, id: "other-project-build", projectId: "other-project" },
      { ...build, id: "other-build", number: 2 },
    ];
    const quiet = await deliver(
      page,
      "build_updated",
      Array.from({ length: 10 }, (_, i) => [elsewhere[i % 2]]),
    );
    console.log("build_updated x10, not on screen", JSON.stringify(quiet));
    expect(quiet.renders.testRunList ?? 0).toBe(0);
    expect(quiet.renders.dataGrid ?? 0).toBe(0);

    // control: a run update does reach the page
    const live = await deliver(page, "testRun_updated", [
      [approved(testRuns[10])],
    ]);
    expect(live.renders.dataGrid ?? 0).toBeGreaterThan(0);
  });

  test("one run update takes the main thread less than the limit", async ({
    page,
  }) => {
    const cdp = await openList(page);

    const counted = await deliver(page, "testRun_updated", [
      [approved(testRuns[9])],
    ]);
    console.log("testRun_updated x1, renders", JSON.stringify(counted));
    expect(counted.renders.dataGrid ?? 0).toBeGreaterThan(0);

    // the render count walks the tree on every commit, which is not the app's cost
    await setCounting(page, false);
    const samples: number[] = [];
    for (const run of testRuns.slice(10, 15)) {
      const before = await taskSeconds(cdp);
      await emitSocketEvent(page, "testRun_updated", [approved(run)]);
      await waitForQuietCommits(page);
      samples.push(Math.round(((await taskSeconds(cdp)) - before) * 1000));
    }
    console.log(
      "testRun_updated x1, main thread ms",
      JSON.stringify({ throttle: THROTTLE, runs: RUNS, samples }),
    );

    // the quietest of five: an update that waits behind another task is noise
    expect(Math.min(...samples)).toBeLessThan(RUN_UPDATE_LIMIT_MS);
  });

  // waits for the dialog's step to be in the URL, which the grid's page reads
  test.fixme("a step in the details dialog renders nothing in the grid", async ({
    page,
  }) => {
    await openLargeBuild(page, testRuns[0].id);
    const step = page.getByRole("heading", { name: /^Step \d+\/\d+:/ });
    await expect(step).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("drawArea").locator("canvas")).toHaveCount(
      2,
      { timeout: 30_000 },
    );
    await expect.poll(() => hasSocket(page)).toBe(true);
    await waitForQuietCommits(page);

    await resetProbe(page);
    const before = await step.textContent();
    await page.keyboard.press("ArrowRight");
    await expect(step).not.toHaveText(before ?? "");
    await waitForQuietCommits(page);

    const { renders } = await readRenders(page);
    expect(renders.dataGrid ?? 0).toBe(0);
  });
});
