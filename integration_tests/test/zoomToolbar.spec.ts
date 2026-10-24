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
  mockGetTestRuns,
  mockImage,
  mockTestRun,
} from "utils/mocks";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;
const testRun = TEST_UNRESOLVED;

// the screenshots are 1280 pixels wide, and the toolbar's buttons zoom by a fifth
const IMAGE_WIDTH = 1280;
const STEP = 1.2;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockGetTestRuns(page, build.id, [testRun]);
  await mockTestRun(page, testRun);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
});

// opens the run once both screenshots are in and fitted to their panes, and
// answers with the width each pane's canvas shows them at
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
  // both panes are fitted by the same scale, which is below the original
  await expect
    .poll(async () => {
      const [baseline, checkpoint] = await details.canvasWidths();

      return baseline < IMAGE_WIDTH && Math.abs(baseline - checkpoint) < 1;
    })
    .toBe(true);
  const [fitted] = await details.canvasWidths();

  return { details, fitted };
};

// the width of both panes, once the zoom has landed; a scale applies at once,
// so this settles within a render
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
