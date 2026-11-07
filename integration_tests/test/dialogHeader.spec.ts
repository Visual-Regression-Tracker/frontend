import { expect, type Page } from "@playwright/test";
import { type OpenProjectPage, test } from "fixtures";
import type { TestRun } from "~client/types";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_NEW,
} from "~client/_test/test.data.helper";
import {
  mockAnalyseNoise,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockImage,
  mockTestRun,
  mockTestRunsWithDetails,
} from "utils/mocks";
import {
  BLUR_REGIONS,
  DINOV2_REGIONS,
  NOISE_CART,
  NOT_ANALYSED,
  withNoiseRegions,
} from "utils/noiseRuns";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;

const openRun = async (
  page: Page,
  openProjectPage: OpenProjectPage,
  runs: TestRun[],
  shown: TestRun,
) => {
  await mockTestRunsWithDetails(page, build.id, runs);
  await mockTestRun(page, shown);
  const { details } = await openProjectPage(project.id, build.id, shown.id);
  return details;
};

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
});

test("shows the position and moves between runs from the header", async ({
  openProjectPage,
  page,
}) => {
  await mockTestRun(page, TEST_RUN_NEW);
  const details = await openRun(
    page,
    openProjectPage,
    [NOISE_CART, TEST_RUN_NEW],
    NOISE_CART,
  );
  await expect(details.step).toHaveText("2/2");
  await expect(details.nextRun).toBeHidden();

  await details.previousRun.click();

  await expect(details.step).toHaveText("1/2");
  await expect(details.previousRun).toBeHidden();
  await expect(page).toHaveURL(new RegExp(`testId=${TEST_RUN_NEW.id}$`));
});

test("offers to analyse a run that was not analysed, from the chip", async ({
  openProjectPage,
  page,
}) => {
  await mockAnalyseNoise(page, { queued: 1, skipped: [] });
  const details = await openRun(
    page,
    openProjectPage,
    [NOT_ANALYSED, TEST_RUN_NEW],
    NOT_ANALYSED,
  );
  await expect(details.noiseChip).toContainText("Not analysed");

  await details.noiseChip.click();
  await expect(details.noisePanel).toContainText(
    "Rendering-noise check: not run",
  );
  await details.analyseRun.click();

  await expect(details.noiseChip).toContainText("Analysing…");
});

test("shows the verdict in the chip and both stages in its popover", async ({
  openProjectPage,
  page,
}) => {
  const details = await openRun(
    page,
    openProjectPage,
    [NOISE_CART],
    withNoiseRegions(NOISE_CART),
  );
  await expect(details.noiseChip).toContainText("Likely noise · 0.39");

  await details.noiseChip.click();

  await expect(details.noisePanel).toContainText(
    "Rendering-noise check: likely noise · score 0.39",
  );
  await expect(details.noisePanel).toContainText(
    "Blur: likely noise (0.39) · DINOv2: likely noise (0.39)",
  );
});

test("draws the areas of the stage chosen in the popover", async ({
  openProjectPage,
  page,
}) => {
  const details = await openRun(
    page,
    openProjectPage,
    [NOISE_CART],
    withNoiseRegions(NOISE_CART),
  );
  await expect(details.drawAreas).toHaveCount(2);
  await details.noiseChip.click();
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

test("closes the popover with Escape and leaves the dialog open", async ({
  openProjectPage,
  page,
}) => {
  const details = await openRun(
    page,
    openProjectPage,
    [NOISE_CART],
    withNoiseRegions(NOISE_CART),
  );
  await details.noiseChip.click();
  await expect(details.noisePanel).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(details.noisePanel).toBeHidden();
  await expect(details.step).toBeVisible();
});
