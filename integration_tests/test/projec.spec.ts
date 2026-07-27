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
