import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import {
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockImage,
  mockTestRunsWithDetails,
} from "utils/mocks";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;
const testRun = TEST_UNRESOLVED;

const IMAGE_WIDTH = 1280;
const STEP = 1.2;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockTestRunsWithDetails(page, build.id, [testRun]);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
});

const openFitted = async (
  openProjectPage: (
    id: string,
    buildId?: string,
    testId?: string,
  ) => Promise<import("pages").ProjectPage>,
) => {
  const { details } = await openProjectPage(project.id, build.id, testRun.id);
  await expect(details.drawAreas).toHaveCount(2);
  await expect(details.page.getByTestId("image-size")).toHaveText([
    "(1280 x 720)",
    "(1280 x 720)",
  ]);
  await expect
    .poll(async () => {
      const [baseline, checkpoint] = await details.canvasWidths();

      return baseline < IMAGE_WIDTH && Math.abs(baseline - checkpoint) < 1;
    })
    .toBe(true);
  const [fitted] = await details.canvasWidths();

  return { details, fitted };
};

const expectWidth = async (
  details: Awaited<ReturnType<typeof openFitted>>["details"],
  width: number,
) => {
  await expect
    .poll(async () => {
      const widths = await details.canvasWidths();

      return widths.every((shown) => Math.abs(shown - width) < 1);
    })
    .toBe(true);
};

test("fits the screenshots into their panes when it opens", async ({
  openProjectPage,
}) => {
  const { fitted } = await openFitted(openProjectPage);

  expect(fitted).toBeGreaterThan(0);
  expect(fitted).toBeLessThan(IMAGE_WIDTH);
});

test("zooms both panes in by a fifth", async ({ openProjectPage }) => {
  const { details, fitted } = await openFitted(openProjectPage);

  await details.zoomIn.click();

  await expectWidth(details, fitted * STEP);
});

test("zooms both panes out by a fifth", async ({ openProjectPage }) => {
  const { details, fitted } = await openFitted(openProjectPage);

  await details.zoomOut.click();

  await expectWidth(details, fitted / STEP);
});

test("zooms in a step at a time", async ({ openProjectPage }) => {
  const { details, fitted } = await openFitted(openProjectPage);

  await details.zoomIn.click();
  await expectWidth(details, fitted * STEP);
  await details.zoomIn.click();

  await expectWidth(details, fitted * STEP * STEP);
});

test("comes back to where it was after zooming in and out", async ({
  openProjectPage,
}) => {
  const { details, fitted } = await openFitted(openProjectPage);

  await details.zoomIn.click();
  await expectWidth(details, fitted * STEP);
  await details.zoomOut.click();

  await expectWidth(details, fitted);
});

test("shows the screenshots at their own size", async ({ openProjectPage }) => {
  const { details } = await openFitted(openProjectPage);

  await details.originalSize.click();

  await expectWidth(details, IMAGE_WIDTH);
});

test("fits the screenshots into their panes again", async ({
  openProjectPage,
}) => {
  const { details, fitted } = await openFitted(openProjectPage);
  await details.zoomIn.click();
  await details.zoomIn.click();
  await details.originalSize.click();
  await expectWidth(details, IMAGE_WIDTH);

  await details.fitToScreen.click();

  await expectWidth(details, fitted);
});

test("fits the screenshots into their panes after zooming out", async ({
  openProjectPage,
}) => {
  const { details, fitted } = await openFitted(openProjectPage);
  await details.zoomOut.click();
  await expectWidth(details, fitted / STEP);
  await details.zoomOut.click();
  await expectWidth(details, fitted / STEP / STEP);

  await details.fitToScreen.click();

  await expectWidth(details, fitted);
});

test("fits the wider screenshot into its pane", async ({
  page,
  openProjectPage,
}) => {
  const mixedSizes = {
    ...testRun,
    imageName: "wide.png",
    baselineName: "narrow.png",
    diffName: null,
  };
  await mockTestRunsWithDetails(page, build.id, [mixedSizes]);
  await mockImage(page, "wide.png");
  await mockImage(page, "narrow.png");
  const { details } = await openProjectPage(
    project.id,
    build.id,
    mixedSizes.id,
  );
  await expect(details.page.getByTestId("image-size")).toHaveText([
    "(800 x 450)",
    "(1600 x 900)",
  ]);
  await details.originalSize.click();

  await details.fitToScreen.click();

  await expect
    .poll(async () => {
      const pane = await details.checkpointPane.boundingBox();
      const [, checkpoint] = await details.canvasWidths();

      // the fit's margin allows a fraction of a pixel over the pane's padding
      return checkpoint > 0 && checkpoint <= pane.width + 1;
    })
    .toBe(true);
});

test("zooms from the original size too", async ({ openProjectPage }) => {
  const { details } = await openFitted(openProjectPage);
  await details.originalSize.click();
  await expectWidth(details, IMAGE_WIDTH);

  await details.zoomOut.click();

  await expectWidth(details, IMAGE_WIDTH / STEP);
});

test("does not zoom in past ten times the original size", async ({
  openProjectPage,
}) => {
  const { details } = await openFitted(openProjectPage);

  // a fitted image takes under fifteen steps to pass ten times its size
  for (let i = 0; i < 20; i++) {
    await details.zoomIn.click();
  }

  await expectWidth(details, IMAGE_WIDTH * 10);
});

test("keeps the zoom when moving to the next run of the same size", async ({
  openProjectPage,
  page,
}) => {
  const next = {
    ...testRun,
    id: "next_run_id",
    name: "zz next run",
    imageName: "next-image.png",
    baselineName: "next-baseline.png",
    diffName: "next-diff.png",
  };
  await mockTestRunsWithDetails(page, build.id, [testRun, next]);
  await mockImage(page, "next-image.png", "image.png");
  await mockImage(page, "next-baseline.png", "baseline.png");
  await mockImage(page, "next-diff.png", "diff.png");
  const { details, fitted } = await openFitted(openProjectPage);
  await details.zoomIn.click();
  await expectWidth(details, fitted * STEP);

  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/testId=next_run_id$/);
  await expect(details.page.getByTestId("image-size")).toHaveText([
    "(1280 x 720)",
    "(1280 x 720)",
  ]);

  await expectWidth(details, fitted * STEP);
});

test("fits again when the next run's screenshots are another size", async ({
  openProjectPage,
  page,
}) => {
  const next = {
    ...testRun,
    id: "next_run_id",
    name: "zz next run",
    imageName: "narrow.png",
    baselineName: "narrow.png",
    diffName: "narrow.png",
  };
  await mockTestRunsWithDetails(page, build.id, [testRun, next]);
  await mockImage(page, "narrow.png");
  const { details, fitted } = await openFitted(openProjectPage);
  await details.zoomIn.click();
  await expectWidth(details, fitted * STEP);

  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/testId=next_run_id$/);
  await expect(details.page.getByTestId("image-size")).toHaveText([
    "(800 x 450)",
    "(800 x 450)",
  ]);

  // the zoom of the 1280 px run would show this one at a width it no longer has
  const inherited = 800 * (fitted / IMAGE_WIDTH) * STEP;
  await expect
    .poll(async () => (await details.canvasWidths())[0])
    .toBeGreaterThan(inherited + 1);
  const [refitted] = await details.canvasWidths();
  expect(refitted).toBeLessThanOrEqual(800);
});
