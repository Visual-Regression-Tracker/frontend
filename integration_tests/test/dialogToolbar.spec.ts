import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_NEW,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import type { TestRun } from "~client/types";
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
const AREA = { id: "area-1", x: 232, y: 123, width: 166, height: 138 };
const withArea: TestRun = {
  ...TEST_UNRESOLVED,
  ignoreAreas: JSON.stringify([AREA]),
  tempIgnoreAreas: "[]",
};

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockGetTestRuns(page, build.id, [withArea, TEST_RUN_NEW]);
  await mockTestRun(page, withArea);
  await mockTestRun(page, TEST_RUN_NEW);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
});

const open = async (
  openProjectPage: (
    id: string,
    buildId?: string,
    testId?: string,
  ) => Promise<import("pages").ProjectPage>,
) => {
  const { details } = await openProjectPage(project.id, build.id, withArea.id);
  await expect(details.drawAreas).toHaveCount(2);
  await details.originalSize.click();
  await expect.poll(() => details.canvasWidths()).toEqual([1280, 1280]);

  return details;
};

test("shows the areas of the run but does not let them be edited until Edit areas", async ({
  openProjectPage,
}) => {
  const details = await open(openProjectPage);

  await expect(details.areasChip).toHaveText("Ignore areas (1)");
  await expect.poll(() => details.lockedRects()).toHaveLength(1);
  expect(await details.ignoreRects()).toEqual([]);
  await expect(details.saveAreas).toHaveCount(0);
  await expect(details.drawMode).toHaveCount(0);

  await details.editAreas.click();

  await expect.poll(() => details.ignoreRects()).toHaveLength(1);
  await expect(details.saveAreas).toBeDisabled();
});

test("hides and shows the areas with the chip", async ({ openProjectPage }) => {
  const details = await open(openProjectPage);
  await expect.poll(() => details.lockedRects()).toHaveLength(1);

  await details.areasChip.click();

  await expect(details.areasChip).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => details.lockedRects()).toHaveLength(0);

  await details.areasChip.click();

  await expect.poll(() => details.lockedRects()).toHaveLength(1);
});

test("drops the unsaved areas on Cancel and leaves the edit mode", async ({
  openProjectPage,
  page,
}) => {
  const details = await open(openProjectPage);
  await details.editAreas.click();
  await details.drawMode.click();
  await details.drag({ x: 600, y: 400 }, { x: 800, y: 500 });
  await expect.poll(() => details.ignoreRects()).toHaveLength(2);
  await expect(details.saveAreas).toBeEnabled();

  await details.cancelBtn.click();

  await expect(details.editAreas).toBeVisible();
  await expect(details.saveAreas).toHaveCount(0);
  await expect.poll(() => details.lockedRects()).toHaveLength(1);
  await details.closeBtn.click();
  await expect(details.discardPrompt).toBeHidden();
  await expect(page).not.toHaveURL(/testId=/);
});

test("shows the zoom as a percentage that follows the buttons", async ({
  openProjectPage,
}) => {
  const details = await open(openProjectPage);
  await expect(details.zoomLevel).toHaveText("100%");

  await details.zoomOut.click();

  await expect(details.zoomLevel).not.toHaveText("100%");
  await details.originalSize.click();
  await expect(details.zoomLevel).toHaveText("100%");
});

test("shows the hotkeys on the buttons that have them", async ({
  openProjectPage,
}) => {
  const details = await open(openProjectPage);

  await expect(details.approve).toBeVisible();
  await expect(details.reject).toBeVisible();
  await expect(details.diffMode).toContainText("D");
});

test("opens the baseline history in a new tab", async ({
  openProjectPage,
  page,
}) => {
  const details = await open(openProjectPage);

  const [history] = await Promise.all([
    page.waitForEvent("popup"),
    details.history.click(),
  ]);

  expect(history.url()).toContain(
    `/${encodeURIComponent(withArea.testVariationId)}`,
  );
});
