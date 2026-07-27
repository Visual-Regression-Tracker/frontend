import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_BUILD_PASSED,
  TEST_BUILD_UNRESOLVED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
  TEST_RUN_OK,
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

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [
    TEST_BUILD_FAILED,
    TEST_BUILD_PASSED,
    TEST_BUILD_UNRESOLVED,
  ]);
  await mockGetBuildDetails(page, TEST_BUILD_FAILED);
  await mockGetTestRuns(page, TEST_BUILD_FAILED.id, [
    TEST_UNRESOLVED,
    TEST_RUN_APPROVED,
    TEST_RUN_NEW,
    TEST_RUN_OK,
  ]);
  await mockTestRun(page, TEST_UNRESOLVED);
  await mockImage(page, "baseline.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "image.png");
});

test("renders", async ({ openProjectPage, page }) => {
  const projectPage = await openProjectPage(project.id);
  await projectPage.buildList.getBuildLocator(TEST_BUILD_FAILED.number).click();

  await expect(page).toHaveScreenshot("project-page-test-run-list.png");

  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  await expect(page).toHaveScreenshot("project-page-test-run-details.png");
});

test("searches builds by ci build id", async ({ openProjectPage, page }) => {
  await mockGetBuilds(
    page,
    project.id,
    [TEST_BUILD_FAILED],
    TEST_BUILD_FAILED.ciBuildId,
  );
  const projectPage = await openProjectPage(project.id);

  await projectPage.buildList.searchInput.fill(TEST_BUILD_FAILED.ciBuildId);

  await expect(
    projectPage.buildList.getBuildLocator(TEST_BUILD_FAILED.number),
  ).toBeVisible();
  await expect(
    projectPage.buildList.getBuildLocator(TEST_BUILD_PASSED.number),
  ).toBeHidden();
});

test("keeps the empty search message inside the sidebar", async ({
  openProjectPage,
  page,
}) => {
  const query = "3".repeat(40);
  await mockGetBuilds(page, project.id, [], query);
  const projectPage = await openProjectPage(project.id);

  await projectPage.buildList.searchInput.fill(query);

  const message = projectPage.buildList.emptyMessage;
  await expect(message).toHaveText(`No builds match "${query}"`);

  const overflow = await message.evaluate(
    (el) => el.scrollWidth - el.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("keeps wheel zoom inside the image pane", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();

  // a wheel over the pane but off the artwork must still be handled by the
  // dialog, otherwise the browser zooms the whole page instead
  const prevented = await pane.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const event = new WheelEvent("wheel", {
      deltaY: 120,
      clientX: box.right - 5,
      clientY: box.bottom - 5,
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  });

  expect(prevented).toBe(true);
});

test("zooms with the cursor off the artwork", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();
  const canvas = page.locator("canvas").first();
  const bounds = await pane.boundingBox();

  // shrink the image until it no longer reaches the far side of the pane
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 20);
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 120);
  }

  const shrunk = await canvas.boundingBox();
  expect(shrunk.x + shrunk.width).toBeLessThan(bounds.x + bounds.width - 20);

  // the empty half of the pane has to zoom the image just the same
  await page.mouse.move(bounds.x + bounds.width - 10, bounds.y + 20);
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, -120);
  }

  const grown = await canvas.boundingBox();
  expect(grown.width).toBeGreaterThan(shrunk.width);
});

test("zooms towards the cursor", async ({ openProjectPage, page }) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();

  // zooming in near the right edge has to pull that edge into view; anchoring
  // at the top left would leave the pane scrolled to 0. Only the horizontal
  // axis is checked because the pane grows in height instead of scrolling.
  const scroll = await pane.evaluate(async (el) => {
    const box = el.getBoundingClientRect();

    for (let i = 0; i < 20; i++) {
      el.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: -120,
          clientX: box.right - 20,
          clientY: box.bottom - 20,
          bubbles: true,
          cancelable: true,
        }),
      );
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    return { left: el.scrollLeft, top: el.scrollTop };
  });

  expect(scroll.left).toBeGreaterThan(0);
});

test("holds the zoom buttons to the same limits as the wheel", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();
  const zoomOut = page.getByTestId("ZoomOutIcon");

  for (let i = 0; i < 60; i++) {
    await zoomOut.click();
  }

  // unclamped this shrinks the image to a fraction of a pixel
  const width = await pane.evaluate(
    (el) => (el.firstElementChild as HTMLElement).offsetWidth,
  );
  expect(width).toBeGreaterThan(100);
});

test("eases the zoom out instead of stopping dead", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();

  const widths = await pane.evaluate(async (el) => {
    const canvas = el.querySelector("canvas") as HTMLCanvasElement;
    const box = el.getBoundingClientRect();

    for (let i = 0; i < 20; i++) {
      el.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: -120,
          clientX: box.left + 20,
          clientY: box.top + 20,
          bubbles: true,
          cancelable: true,
        }),
      );
    }

    const samples: number[] = [];

    for (let frame = 0; frame < 12; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      samples.push(Math.round(canvas.getBoundingClientRect().width));
    }

    return samples;
  });

  // jumping straight to the target would make every sample identical
  expect(new Set(widths).size).toBeGreaterThan(3);
});

test("can download images", async ({ openProjectPage, page }) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);

  await projectPage.testRunList.checkRow(TEST_UNRESOLVED.id);
  await projectPage.testRunList.checkRow(TEST_RUN_NEW.id);

  await projectPage.testRunList.downloadBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "2 test runs processed.",
  );
});
