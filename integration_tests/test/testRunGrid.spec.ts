import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
  TEST_RUN_OK,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import {
  API_URL,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockTestRun,
} from "utils/mocks";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockGetTestRuns(page, build.id, [
    TEST_UNRESOLVED,
    TEST_RUN_APPROVED,
    TEST_RUN_NEW,
    TEST_RUN_OK,
  ]);
  await mockTestRun(page, TEST_UNRESOLVED);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
});

test("switches to the grid and keeps the choice after a reload", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);

  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.grid).toBeVisible();

  await page.reload();

  await expect(projectPage.testRunList.grid).toBeVisible();
});

test("shows a card per test run and narrows with the filters", async ({
  openProjectPage,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await expect(projectPage.testRunList.cards).toHaveCount(4);

  await projectPage.testRunFilters.name.fill("unresolved");

  await expect(projectPage.testRunList.cards).toHaveCount(1);
});

test("opens the details dialog from a card", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await projectPage.testRunList.getCard(TEST_UNRESOLVED.name).click();

  await expect(page.getByTestId("drawArea").first()).toBeVisible();
});

test("approves the runs selected in the grid", async ({
  openProjectPage,
  page,
}) => {
  const approved: string[][] = [];
  await page.route(
    `${API_URL}/test-runs/approve?merge=false`,
    (route, request) => {
      approved.push(request.postDataJSON());
      return route.fulfill({ body: "{}" });
    },
  );

  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  // only new and unresolved runs are eligible, so an approved one would prove
  // nothing: idsEligibleForApproveOrReject would drop it and send an empty list
  await projectPage.testRunList.checkCard(TEST_RUN_NEW.name);
  await projectPage.testRunList.checkCard(TEST_UNRESOLVED.name);
  await projectPage.testRunList.approveBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "2 test runs processed.",
  );
  expect(approved).toEqual([[TEST_RUN_NEW.id, TEST_UNRESOLVED.id]]);
});

test("loads card images lazily", async ({ openProjectPage }) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await expect(
    projectPage.testRunList.cards.first().locator("img"),
  ).toHaveAttribute("loading", "lazy");
});
