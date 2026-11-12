import { expect, type Request } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
} from "~client/_test/test.data.helper";
import type { TestRun } from "~client/types";
import {
  analysesNoise,
  mockAnalyseNoise,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockImage,
  mockTestRun,
  mockTestRunsWithDetails,
} from "utils/mocks";
import {
  ANALYSED_RUNS,
  CHANGE_CHECKOUT,
  NOISE_CART,
  NOISE_LOGIN,
  NOT_ANALYSED,
  PENDING_SEARCH,
  PROJECT_WITHOUT_NOISE,
} from "utils/noiseRuns";
import { postData } from "utils/postData";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;

const sorted = (ids: string[]) => ids.toSorted((a, b) => a.localeCompare(b));
const idsOf = (runs: TestRun[]) => sorted(runs.map((run) => run.id));
const sentIds = (request: Request) =>
  sorted(postData<{ ids: string[] }>(request).ids);

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
});

test.describe("project without the noise check", () => {
  test("hides the Noise column and the hint chips", async ({
    openProjectPage,
    page,
  }) => {
    await mockGetProjects(page, [PROJECT_WITHOUT_NOISE]);
    await mockTestRunsWithDetails(page, build.id, ANALYSED_RUNS);
    const { testRunList } = await openProjectPage(project.id, build.id);

    await expect(testRunList.rows).toHaveCount(ANALYSED_RUNS.length);
    await expect(testRunList.noiseColumnHeader).toHaveCount(0);
    await expect(testRunList.noiseChips).toHaveCount(0);
  });
});

test.describe("run list", () => {
  const withPending = [
    ...ANALYSED_RUNS,
    PENDING_SEARCH,
    TEST_RUN_APPROVED,
    TEST_RUN_NEW,
  ];
  const withUnanalysed = [
    ...ANALYSED_RUNS,
    NOT_ANALYSED,
    TEST_RUN_APPROVED,
    TEST_RUN_NEW,
  ];

  test("shows a hint chip on each analysed unresolved run", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, withPending);
    const { testRunList } = await openProjectPage(project.id, build.id);

    await expect(testRunList.rows).toHaveCount(withPending.length);
    await expect(testRunList.noiseColumnHeader).toHaveCount(1);
    await expect(testRunList.noiseChip(NOISE_CART.id)).toHaveText(
      "Likely noise",
    );
    await expect(testRunList.noiseChip(CHANGE_CHECKOUT.id)).toHaveText(
      "Likely change",
    );
    await expect(testRunList.noiseChip(PENDING_SEARCH.id)).toHaveText(
      "Analysing…",
    );
    await expect(testRunList.noiseChips).toHaveCount(5);
    await expect(testRunList.noiseChip(TEST_RUN_APPROVED.id)).toHaveCount(0);
  });

  test("counts the runs that are still being analysed in the build header", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, withPending);
    const { buildDetails } = await openProjectPage(project.id, build.id);

    await expect(buildDetails.noiseLine).toHaveText("Analysing 1 of 5…");
    await buildDetails.openMenu();
    await expect(buildDetails.analyseNoiseItem).toBeDisabled();
  });

  test("sends the unresolved runs to the analysis and shows them as analysing", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, withUnanalysed);
    await mockAnalyseNoise(page, { queued: 5, skipped: [] });
    const { buildDetails } = await openProjectPage(project.id, build.id);
    await buildDetails.openMenu();
    await expect(buildDetails.analyseNoiseItem).toHaveText("Analyse noise (5)");

    const [request] = await Promise.all([
      page.waitForRequest(analysesNoise),
      buildDetails.analyseNoiseItem.click(),
    ]);

    expect(sentIds(request)).toEqual(idsOf([...ANALYSED_RUNS, NOT_ANALYSED]));
    await expect(buildDetails.noiseLine).toHaveText("Analysing 5 of 5…");
    await buildDetails.openMenu();
    await expect(buildDetails.analyseNoiseItem).toBeDisabled();
  });

  test("analyses the selected runs and shows them as analysing at once", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, withUnanalysed);
    await mockAnalyseNoise(page, { queued: 2, skipped: [] });
    const { testRunList, notification } = await openProjectPage(
      project.id,
      build.id,
    );
    await expect(testRunList.rows).toHaveCount(withUnanalysed.length);
    await testRunList.checkRow(NOT_ANALYSED.id);
    await testRunList.checkRow(NOISE_CART.id);

    const [request] = await Promise.all([
      page.waitForRequest(analysesNoise),
      testRunList.analyseBtn.click(),
    ]);

    expect(sentIds(request)).toEqual(idsOf([NOT_ANALYSED, NOISE_CART]));
    await expect(testRunList.noiseChip(NOT_ANALYSED.id)).toHaveText(
      "Analysing…",
    );
    await expect(testRunList.noiseChip(NOISE_CART.id)).toHaveText("Analysing…");
    await expect(testRunList.noiseChip(NOISE_LOGIN.id)).toHaveText(
      "Likely noise",
    );
    await expect(notification.toast("Analysing 2 test runs.")).toBeVisible();
  });

  test("warns when the analysis queue is full", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, withUnanalysed);
    await mockAnalyseNoise(page, {
      queued: 0,
      skipped: [{ id: NOT_ANALYSED.id, reason: "queue full" }],
    });
    const projectPage = await openProjectPage(project.id, build.id);

    await projectPage.buildDetails.openMenu();
    await projectPage.buildDetails.analyseNoiseItem.click();

    await expect(
      projectPage.notification.toast("Queue is full, try again in a minute"),
    ).toBeVisible();
  });

  test("analyses only the runs the filter leaves", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, withUnanalysed);
    await mockAnalyseNoise(page, { queued: 1, skipped: [] });
    const { buildDetails, testRunFilters } = await openProjectPage(
      project.id,
      build.id,
    );
    await testRunFilters.name.fill("Login");
    await buildDetails.openMenu();
    await expect(buildDetails.analyseNoiseItem).toHaveText("Analyse noise (1)");

    const [request] = await Promise.all([
      page.waitForRequest(analysesNoise),
      buildDetails.analyseNoiseItem.click(),
    ]);

    expect(sentIds(request)).toEqual([NOISE_LOGIN.id]);
  });
});

test.describe("build details", () => {
  test("filters the list by the status counters", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, [
      ...ANALYSED_RUNS,
      TEST_RUN_APPROVED,
      TEST_RUN_NEW,
    ]);
    const { buildDetails, testRunList } = await openProjectPage(
      project.id,
      build.id,
    );
    await expect(testRunList.rows).toHaveCount(ANALYSED_RUNS.length + 2);
    await expect(buildDetails.statusCounter("Failed")).toBeHidden();

    await buildDetails.statusCounter("Unresolved").click();
    await expect(testRunList.rows).toHaveCount(ANALYSED_RUNS.length);

    await buildDetails.statusCounter("New").click();
    await expect(testRunList.rows).toHaveCount(ANALYSED_RUNS.length + 1);

    await buildDetails.statusCounter("All").click();
    await expect(testRunList.rows).toHaveCount(ANALYSED_RUNS.length + 2);
  });
});

test.describe("details dialog", () => {
  test("offers to analyse a run that has not been analysed", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, [NOT_ANALYSED, TEST_RUN_NEW]);
    await mockTestRun(page, TEST_RUN_NEW);
    await mockAnalyseNoise(page, { queued: 1, skipped: [] });
    const { details } = await openProjectPage(
      project.id,
      build.id,
      NOT_ANALYSED.id,
    );
    await details.noiseChip.click();
    await expect(details.noisePanel).toContainText(
      "Rendering-noise check: not run",
    );

    const [request] = await Promise.all([
      page.waitForRequest(analysesNoise),
      details.analyseRun.click(),
    ]);

    expect(postData<{ ids: string[] }>(request).ids).toEqual([NOT_ANALYSED.id]);
    await expect(details.noiseChip).toContainText("Analysing…");
  });
});
