import { expect, type Request } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
} from "~client/_test/test.data.helper";
import type { NoiseSummary, TestRun } from "~client/types";
import {
  analysesNoise,
  mockAnalyseNoise,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockImage,
  mockNoiseSummary,
  mockTestRun,
  mockTestRunsWithDetails,
} from "utils/mocks";
import {
  ANALYSED_RUNS,
  BLUR_REGIONS,
  CHANGE_CHECKOUT,
  DINOV2_REGIONS,
  NOISE_CART,
  NOISE_LOGIN,
  NOISE_PRICING,
  NOT_ANALYSED,
  PENDING_SEARCH,
  RENDERER_CHANGE_SUMMARY,
  withNoiseRegions,
} from "utils/noiseRuns";
import { postData } from "utils/postData";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;

const sorted = (ids: string[]) => ids.toSorted((a, b) => a.localeCompare(b));
const idsOf = (runs: TestRun[]) => sorted(runs.map((run) => run.id));
const sentIds = (request: Request) =>
  sorted(postData<{ ids: string[] }>(request).ids);

const NOT_RENDERER_CHANGE: NoiseSummary = {
  ...RENDERER_CHANGE_SUMMARY,
  noiseLike: 1,
  byEnvironment: [
    { ...RENDERER_CHANGE_SUMMARY.byEnvironment[0], noiseLike: 1 },
  ],
};

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockNoiseSummary(page, build.id, NOT_RENDERER_CHANGE);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
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

  test("sends the unresolved runs to the analysis and offers it again after the fallback wait", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, withUnanalysed);
    await mockAnalyseNoise(page, { queued: 5, skipped: [] });
    const { buildDetails } = await openProjectPage(project.id, build.id);
    await buildDetails.openMenu();
    await expect(buildDetails.analyseNoiseItem).toHaveText(
      "Analyse rendering noise (5)",
    );

    const [request] = await Promise.all([
      page.waitForRequest(analysesNoise),
      buildDetails.analyseNoiseItem.click(),
    ]);

    expect(sentIds(request)).toEqual(idsOf([...ANALYSED_RUNS, NOT_ANALYSED]));
    await buildDetails.openMenu();
    await expect(buildDetails.analyseNoiseItem).toBeEnabled();
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

  test("filters the list to the likely noise", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, withUnanalysed);
    const { testRunList, testRunFilters } = await openProjectPage(
      project.id,
      build.id,
    );
    await expect(testRunList.rows).toHaveCount(withUnanalysed.length);

    await testRunFilters.selectNoiseHint("Likely noise");

    await expect(testRunList.rows).toHaveCount(3);
    await expect(testRunList.noiseChips).toHaveText([
      "Likely noise",
      "Likely noise",
      "Likely noise",
    ]);
  });

  test("offers three hints in the filter", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, withUnanalysed);
    const { testRunFilters } = await openProjectPage(project.id, build.id);

    await testRunFilters.noiseHint.click();

    await expect(testRunFilters.noiseHintOptions).toHaveText([
      "Likely noise",
      "Likely change",
      "Not analysed",
    ]);
  });

  test("analyses only the runs the filter leaves", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, withUnanalysed);
    await mockAnalyseNoise(page, { queued: 3, skipped: [] });
    const { buildDetails, testRunFilters } = await openProjectPage(
      project.id,
      build.id,
    );
    await testRunFilters.selectNoiseHint("Likely noise");
    await buildDetails.openMenu();
    await expect(buildDetails.analyseNoiseItem).toHaveText(
      "Analyse rendering noise (3)",
    );

    const [request] = await Promise.all([
      page.waitForRequest(analysesNoise),
      buildDetails.analyseNoiseItem.click(),
    ]);

    expect(sentIds(request)).toEqual(
      idsOf([NOISE_CART, NOISE_LOGIN, NOISE_PRICING]),
    );
  });
});

test.describe("build details", () => {
  test("sums up how many unresolved runs look like noise", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, [
      ...ANALYSED_RUNS,
      NOT_ANALYSED,
      TEST_RUN_APPROVED,
    ]);
    const projectPage = await openProjectPage(project.id, build.id);

    await expect(projectPage.noiseCaption).toHaveText(
      "3 of 5 unresolved look like rendering noise · analysed 4 of 5",
    );
    await expect(projectPage.noiseBanner).toHaveCount(0);
  });

  test("shows the likely noise from the summary line", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, [
      ...ANALYSED_RUNS,
      TEST_RUN_APPROVED,
    ]);
    const { buildDetails, testRunList } = await openProjectPage(
      project.id,
      build.id,
    );
    await expect(testRunList.rows).toHaveCount(ANALYSED_RUNS.length + 1);

    await buildDetails.showNoise.click();

    await expect(testRunList.rows).toHaveCount(3);
  });

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
    await expect(buildDetails.statusCounter("Failed")).toBeDisabled();

    await buildDetails.statusCounter("Unresolved").click();
    await expect(testRunList.rows).toHaveCount(ANALYSED_RUNS.length);

    await buildDetails.statusCounter("New").click();
    await expect(testRunList.rows).toHaveCount(ANALYSED_RUNS.length + 1);

    await buildDetails.statusCounter("All").click();
    await expect(testRunList.rows).toHaveCount(ANALYSED_RUNS.length + 2);
  });

  test("points out a renderer change when nearly every diff is noise", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, ANALYSED_RUNS);
    await mockNoiseSummary(page, build.id, RENDERER_CHANGE_SUMMARY);
    const projectPage = await openProjectPage(project.id, build.id);

    await expect(projectPage.noiseBanner).toHaveText(
      "Chrome runs look like a renderer change: 4 of 5 diffs are rendering noise. Filter likely noise and review them in one pass",
    );
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
    await expect(details.noisePanel).toContainText(
      "Rendering-noise check: not run",
    );

    const [request] = await Promise.all([
      page.waitForRequest(analysesNoise),
      details.analyseRun.click(),
    ]);

    expect(postData<{ ids: string[] }>(request).ids).toEqual([NOT_ANALYSED.id]);
    await expect(details.noisePanel).toContainText("Analysing…");
  });

  test("shows both stages of the verdict", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, [NOISE_CART]);
    await mockTestRun(page, withNoiseRegions(NOISE_CART));
    const { details } = await openProjectPage(
      project.id,
      build.id,
      NOISE_CART.id,
    );

    await expect(details.noisePanel).toContainText(
      "Rendering-noise check: likely noise · score 0.39",
    );
    await expect(details.noisePanel).toContainText(
      "Blur: likely noise (0.39) · DINOv2: likely noise (0.39)",
    );
  });

  test("draws the areas of the chosen stage over the image", async ({
    openProjectPage,
    page,
  }) => {
    await mockTestRunsWithDetails(page, build.id, [NOISE_CART]);
    await mockTestRun(page, withNoiseRegions(NOISE_CART));
    const { details } = await openProjectPage(
      project.id,
      build.id,
      NOISE_CART.id,
    );
    await expect(details.drawAreas).toHaveCount(2);
    await expect(details.hintBlur).toBeEnabled();
    await expect.poll(() => details.lockedRects()).toEqual([]);

    await details.hintBlur.click();
    await expect
      .poll(() => details.lockedRects())
      .toHaveLength(BLUR_REGIONS.length);

    await details.hintDinov2.click();
    await expect
      .poll(() => details.lockedRects())
      .toHaveLength(DINOV2_REGIONS.length);

    await details.hintDinov2.click();
    await expect.poll(() => details.lockedRects()).toEqual([]);
  });
});
