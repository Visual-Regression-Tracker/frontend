import { expect, Page } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_NEW,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import type { TestRun } from "~client/types";
import {
  API_URL,
  mockAddIgnoreAreas,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockTestRun,
  mockUpdateIgnoreAreas,
} from "utils/mocks";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;

const EXISTING_AREA = {
  id: "1606901916571",
  x: 232,
  y: 123,
  width: 166,
  height: 138,
};
const TEMP_AREA = { x: 100, y: 300, width: 600, height: 700 };

const withArea: TestRun = {
  ...TEST_UNRESOLVED,
  ignoreAreas: JSON.stringify([EXISTING_AREA]),
  tempIgnoreAreas: "[]",
};
const withoutAreas: TestRun = {
  ...TEST_UNRESOLVED,
  ignoreAreas: "[]",
  tempIgnoreAreas: "[]",
};

const updatedAreas = (request: { url: () => string; method: () => string }) =>
  request.url() === `${API_URL}/test-runs/ignoreAreas/update` &&
  request.method() === "POST";

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
  await mockUpdateIgnoreAreas(page);
  await mockAddIgnoreAreas(page);
});

// at the image's own size a screen point is the image point the areas are measured in
const openAtOriginalSize = async (
  openProjectPage: (
    id: string,
    buildId?: string,
    testId?: string,
  ) => Promise<import("pages").ProjectPage>,
  page: Page,
  testRun: TestRun,
) => {
  await mockGetTestRuns(page, build.id, [testRun, TEST_RUN_NEW]);
  await mockTestRun(page, testRun);
  await mockTestRun(page, TEST_RUN_NEW);
  const { details } = await openProjectPage(project.id, build.id, testRun.id);
  await expect(details.drawAreas).toHaveCount(2);
  await details.originalSize.click();
  await expect.poll(() => details.canvasWidths()).toEqual([1280, 1280]);

  return details;
};

test("draws the areas the run already has", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withArea);

  await expect
    .poll(() => details.ignoreRects())
    .toEqual([
      {
        x: EXISTING_AREA.x,
        y: EXISTING_AREA.y,
        width: EXISTING_AREA.width,
        height: EXISTING_AREA.height,
      },
    ]);
  await expect(details.saveAreas).toBeDisabled();
});

test("draws the areas applied at upload where they cannot be edited", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, {
    ...TEST_UNRESOLVED,
    ignoreAreas: "[]",
  });

  await expect.poll(() => details.lockedRects()).toEqual([TEMP_AREA]);
  expect(await details.ignoreRects()).toEqual([]);
  await expect(page.getByTestId("WarningRoundedIcon").first()).toBeVisible();
});

test("draws a rectangle and saves it as an ignore area", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withoutAreas);

  await details.drawMode.click();
  await expect(details.drawMode).toHaveAttribute("aria-pressed", "true");
  await details.drag({ x: 40, y: 40 }, { x: 200, y: 120 });

  await expect
    .poll(() => details.ignoreRects())
    .toEqual([{ x: 40, y: 40, width: 160, height: 80 }]);
  await expect(details.saveAreas).toBeEnabled();

  const [request] = await Promise.all([
    page.waitForRequest(updatedAreas),
    details.saveAreas.click(),
  ]);

  expect(request.postDataJSON()).toEqual({
    ids: [withoutAreas.id],
    ignoreAreas: [
      {
        id: expect.stringMatching(/^\d+$/),
        x: 40,
        y: 40,
        width: 160,
        height: 80,
      },
    ],
  });
  await expect(page.getByText("Ignore areas are updated.")).toBeVisible();
  await expect(details.saveAreas).toBeDisabled();
});

test("adds a drawn rectangle to the areas the run has", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withArea);

  await details.drawMode.click();
  await details.drag({ x: 500, y: 40 }, { x: 600, y: 100 });

  const [request] = await Promise.all([
    page.waitForRequest(updatedAreas),
    details.saveAreas.click(),
  ]);

  expect(request.postDataJSON().ignoreAreas).toEqual([
    EXISTING_AREA,
    { id: expect.any(String), x: 500, y: 40, width: 100, height: 60 },
  ]);
});

test("leaves draw mode after one rectangle", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withoutAreas);

  await details.drawMode.click();
  await details.drag({ x: 40, y: 40 }, { x: 200, y: 120 });

  // the toggle drops by itself: a second drag without pressing it again would pan
  await expect(details.drawMode).toHaveAttribute("aria-pressed", "false");
});

test("draws no rectangle without draw mode", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withoutAreas);

  await details.drag({ x: 40, y: 40 }, { x: 200, y: 120 });

  expect(await details.ignoreRects()).toEqual([]);
  await expect(details.saveAreas).toBeDisabled();
});

test("makes a click in draw mode the smallest area", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withoutAreas);

  await details.drawMode.click();
  await details.clickAt({ x: 60, y: 60 });

  await expect
    .poll(() => details.ignoreRects())
    .toEqual([{ x: 60, y: 60, width: 5, height: 5 }]);
});

test("selects an area by clicking it and lets go on a click elsewhere", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withArea);
  await expect(details.deleteArea).toBeDisabled();
  await expect(details.applyAreas).toBeDisabled();

  await details.clickAt({ x: 315, y: 192 });

  await expect.poll(() => details.hasSelection()).toBe(true);
  await expect(details.deleteArea).toBeEnabled();
  await expect(details.applyAreas).toBeEnabled();

  await details.clickAt({ x: 40, y: 300 });

  await expect.poll(() => details.hasSelection()).toBe(false);
  await expect(details.deleteArea).toBeDisabled();
});

test("deletes the selected area with the toolbar and saves", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withArea);
  await details.clickAt({ x: 315, y: 192 });

  await details.deleteArea.click();

  await expect.poll(() => details.ignoreRects()).toEqual([]);
  await expect(details.deleteArea).toBeDisabled();
  const [request] = await Promise.all([
    page.waitForRequest(updatedAreas),
    details.saveAreas.click(),
  ]);
  expect(request.postDataJSON()).toEqual({
    ids: [withArea.id],
    ignoreAreas: [],
  });
});

test("deletes the selected area with the Delete key", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withArea);
  await details.clickAt({ x: 315, y: 192 });
  await expect.poll(() => details.hasSelection()).toBe(true);

  await page.keyboard.press("Delete");

  await expect.poll(() => details.ignoreRects()).toEqual([]);
  await expect(details.saveAreas).toBeEnabled();
});

test("clears every area at once and saves", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withArea);
  await details.drawMode.click();
  await details.drag({ x: 500, y: 40 }, { x: 600, y: 100 });
  await expect.poll(async () => (await details.ignoreRects()).length).toBe(2);

  await details.clearAreas.click();

  await expect.poll(() => details.ignoreRects()).toEqual([]);
  await expect(details.clearAreas).toBeDisabled();
  const [request] = await Promise.all([
    page.waitForRequest(updatedAreas),
    details.saveAreas.click(),
  ]);
  expect(request.postDataJSON()).toEqual({
    ids: [withArea.id],
    ignoreAreas: [],
  });
});

test("applies the selected area to every run in the build", async ({
  openProjectPage,
  page,
}) => {
  await page.route(
    (url) =>
      url.pathname === "/test-runs" &&
      url.searchParams.get("buildId") === withArea.buildId,
    (route) =>
      route.fulfill({
        body: JSON.stringify([withArea, { ...TEST_RUN_NEW, id: "other_run" }]),
      }),
  );
  const details = await openAtOriginalSize(openProjectPage, page, withArea);
  await details.clickAt({ x: 315, y: 192 });

  await details.applyAreas.click();
  await expect(
    page.getByText(
      "All images in the current build will be re-compared with new ignore area taken into account. Are you sure?",
    ),
  ).toBeVisible();
  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/test-runs/ignoreAreas/add` &&
        request.method() === "POST",
    ),
    page.getByRole("button", { name: "Yes" }).click(),
  ]);

  expect(request.postDataJSON()).toEqual({
    ids: [withArea.id, "other_run"],
    ignoreAreas: [EXISTING_AREA],
  });
  await expect(
    page.getByText("Ignore areas are updated in all images in this build."),
  ).toBeVisible();
  await expect(details.applyAreas).toBeDisabled();
});

test("does not apply the area when the question is declined", async ({
  openProjectPage,
  page,
}) => {
  const applied: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/ignoreAreas/")) {
      applied.push(request.url());
    }
  });
  const details = await openAtOriginalSize(openProjectPage, page, withArea);
  await details.clickAt({ x: 315, y: 192 });
  await details.applyAreas.click();

  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByRole("button", { name: "Yes" })).toBeHidden();
  expect(applied).toEqual([]);
});

test("saves the area drawn in compare mode as the areas around it", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withoutAreas);
  await details.areaKind.click();
  await page.getByRole("option", { name: "Compare Area" }).click();
  await details.drawMode.click();
  await details.drag({ x: 40, y: 40 }, { x: 200, y: 120 });
  await expect.poll(async () => (await details.ignoreRects()).length).toBe(1);

  const [request] = await Promise.all([
    page.waitForRequest(updatedAreas),
    details.saveAreas.click(),
  ]);

  // the 1280 x 720 image minus the 160 x 80 area at (40, 40), cut in eight
  const areas = request
    .postDataJSON()
    .ignoreAreas.map(({ x, y, width, height }) => ({ x, y, width, height }));
  expect(areas).toEqual([
    { x: 0, y: 0, width: 40, height: 40 },
    { x: 40, y: 0, width: 160, height: 40 },
    { x: 200, y: 0, width: 1080, height: 40 },
    { x: 0, y: 40, width: 40, height: 80 },
    { x: 200, y: 40, width: 1080, height: 80 },
    { x: 0, y: 120, width: 40, height: 600 },
    { x: 40, y: 120, width: 160, height: 600 },
    { x: 200, y: 120, width: 1080, height: 600 },
  ]);
  await expect(
    page.getByText(
      "Selected area has been inverted to ignore areas and saved.",
    ),
  ).toBeVisible();
});

test("saves the area drawn in compare mode, not the one the run had", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withArea);
  await details.areaKind.click();
  await page.getByRole("option", { name: "Compare Area" }).click();
  await details.drawMode.click();
  await details.drag({ x: 500, y: 40 }, { x: 600, y: 100 });
  await expect.poll(async () => (await details.ignoreRects()).length).toBe(2);

  const [request] = await Promise.all([
    page.waitForRequest(updatedAreas),
    details.saveAreas.click(),
  ]);

  // the 1280 x 720 image minus the 100 x 60 area at (500, 40), cut in eight
  const areas = request
    .postDataJSON()
    .ignoreAreas.map(({ x, y, width, height }) => ({ x, y, width, height }));
  expect(areas).toEqual([
    { x: 0, y: 0, width: 500, height: 40 },
    { x: 500, y: 0, width: 100, height: 40 },
    { x: 600, y: 0, width: 680, height: 40 },
    { x: 0, y: 40, width: 500, height: 60 },
    { x: 600, y: 40, width: 680, height: 60 },
    { x: 0, y: 100, width: 500, height: 620 },
    { x: 500, y: 100, width: 100, height: 620 },
    { x: 600, y: 100, width: 680, height: 620 },
  ]);
});

test("asks before leaving with an area that was not saved", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withoutAreas);
  await details.drawMode.click();
  await details.drag({ x: 40, y: 40 }, { x: 200, y: 120 });
  await expect(details.saveAreas).toBeEnabled();

  await details.closeBtn.click();

  await expect(details.discardPrompt).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(details.discardPrompt).toBeHidden();
  await expect(details.drawAreas).toHaveCount(2);
  await expect(details.saveAreas).toBeEnabled();
  expect(await details.ignoreRects()).toHaveLength(1);

  await details.closeBtn.click();
  await page.getByRole("button", { name: "Discard" }).click();

  await expect(details.drawAreas).toHaveCount(0);
  await expect(page).not.toHaveURL(/testId=/);
});

test("asks before leaving on Escape with an area that was not saved", async ({
  openProjectPage,
  page,
}) => {
  const details = await openAtOriginalSize(openProjectPage, page, withoutAreas);
  await details.drawMode.click();
  await details.drag({ x: 40, y: 40 }, { x: 200, y: 120 });
  await expect(details.saveAreas).toBeEnabled();

  await page.keyboard.press("Escape");

  await expect(details.discardPrompt).toBeVisible();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(details.drawAreas).toHaveCount(0);
  await expect(page).not.toHaveURL(/testId=/);
});
