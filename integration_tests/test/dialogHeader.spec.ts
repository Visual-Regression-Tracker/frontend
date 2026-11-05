import { expect } from "@playwright/test";
import { test } from "fixtures";
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
  await mockTestRunsWithDetails(page, build.id, [NOISE_CART, TEST_RUN_NEW]);
  await mockTestRun(page, NOISE_CART);
  await mockTestRun(page, TEST_RUN_NEW);
  const { details } = await openProjectPage(
    project.id,
    build.id,
    NOISE_CART.id,
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
  await mockTestRunsWithDetails(page, build.id, [NOT_ANALYSED, TEST_RUN_NEW]);
  await mockTestRun(page, NOT_ANALYSED);
  await mockAnalyseNoise(page, { queued: 1, skipped: [] });
  const { details } = await openProjectPage(
    project.id,
    build.id,
    NOT_ANALYSED.id,
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
  await mockTestRunsWithDetails(page, build.id, [NOISE_CART]);
  await mockTestRun(page, withNoiseRegions(NOISE_CART));
  const { details } = await openProjectPage(
    project.id,
    build.id,
    NOISE_CART.id,
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
  await mockTestRunsWithDetails(page, build.id, [NOISE_CART]);
  await mockTestRun(page, withNoiseRegions(NOISE_CART));
  const { details } = await openProjectPage(
    project.id,
    build.id,
    NOISE_CART.id,
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
  await mockTestRunsWithDetails(page, build.id, [NOISE_CART]);
  await mockTestRun(page, withNoiseRegions(NOISE_CART));
  const { details } = await openProjectPage(
    project.id,
    build.id,
    NOISE_CART.id,
  );
  await details.noiseChip.click();
  await expect(details.noisePanel).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(details.noisePanel).toBeHidden();
  await expect(details.step).toBeVisible();
});
