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
