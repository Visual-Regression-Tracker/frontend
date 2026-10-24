import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_PASSED,
  TEST_BUILD_UNRESOLVED,
  TEST_PROJECT,
} from "~client/_test/test.data.helper";
import {
  API_URL,
  mockApiError,
  mockDeleteBuilds,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockUpdateBuild,
} from "utils/mocks";

const project = TEST_PROJECT;
const runningBuild = { ...TEST_BUILD_UNRESOLVED, isRunning: true };
const finishedBuild = TEST_BUILD_PASSED;

const isPatchOf =
  (id: string) => (request: { url(): string; method(): string }) =>
    request.url() === `${API_URL}/builds/${id}` && request.method() === "PATCH";

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [runningBuild, finishedBuild]);
  await mockGetBuildDetails(page, runningBuild);
  await mockGetBuildDetails(page, finishedBuild);
  await mockGetTestRuns(page, runningBuild.id, []);
  await mockGetTestRuns(page, finishedBuild.id, []);
});

test("stops a running build", async ({ openProjectPage, page }) => {
  await mockUpdateBuild(page, runningBuild);
  const { buildList } = await openProjectPage(project.id);

  await buildList.openMenu(runningBuild.number);
  const [request] = await Promise.all([
    page.waitForRequest(isPatchOf(runningBuild.id)),
    buildList.menuItem("Stop").click(),
  ]);

  expect(request.postDataJSON()).toEqual({ isRunning: false });
  await expect(buildList.menu).toBeHidden();
  await expect(
    page.locator("#notistack-snackbar").filter({
      hasText: `${runningBuild.id} finished`,
    }),
  ).toBeVisible();
});

test("offers no stop for a finished build", async ({ openProjectPage }) => {
  const { buildList } = await openProjectPage(project.id);

  await buildList.openMenu(finishedBuild.number);

  await expect(buildList.menuItem("Edit CI Build")).toBeVisible();
  await expect(buildList.menuItem("Delete")).toBeVisible();
  await expect(buildList.menuItem("Stop")).toHaveCount(0);
});

test("changes the CI build id", async ({ openProjectPage, page }) => {
  await mockUpdateBuild(page, finishedBuild);
  const projectPage = await openProjectPage(project.id);
  const { buildList, modal } = projectPage;

  await buildList.openMenu(finishedBuild.number);
  await buildList.menuItem("Edit CI Build").click();
  await expect(modal.dialog).toContainText(
    `Edit the ci build id for build: #${finishedBuild.number}`,
  );
  await buildList.ciBuildIdInput.fill("release-42");
  const [request] = await Promise.all([
    page.waitForRequest(isPatchOf(finishedBuild.id)),
    modal.confirmBtn.click(),
  ]);

  expect(request.postDataJSON()).toEqual({ ciBuildId: "release-42" });
  await expect(modal.dialog).toBeHidden();
});

test("does not save a CI build id that is too short", async ({
  openProjectPage,
  page,
}) => {
  const patches: string[] = [];
  page.on("request", (request) => {
    if (isPatchOf(finishedBuild.id)(request)) {
      patches.push(request.url());
    }
  });
  const { buildList, modal } = await openProjectPage(project.id);

  await buildList.openMenu(finishedBuild.number);
  await buildList.menuItem("Edit CI Build").click();
  await buildList.ciBuildIdInput.fill("r");
  await modal.confirmBtn.click();

  await expect(
    modal.dialog.getByText("Enter at least two characters."),
  ).toBeVisible();
  expect(patches).toEqual([]);
});

test("opens nothing by itself after a failed CI build id change", async ({
  openProjectPage,
  page,
}) => {
  await mockApiError(
    page,
    (url) => url.pathname === `/builds/${finishedBuild.id}`,
    500,
    "Could not save",
  );
  const { buildList, modal, notification } = await openProjectPage(project.id);

  await buildList.openMenu(finishedBuild.number);
  await buildList.menuItem("Edit CI Build").click();
  await buildList.ciBuildIdInput.fill("release-42");
  await modal.confirmBtn.click();
  await expect(notification.message).toHaveText("Could not save");

  // the next menu opens as a menu, not straight into the old edit dialog
  await buildList.openMenu(runningBuild.number);
  await expect(buildList.menu).toBeVisible();
  await expect(modal.dialog).toHaveCount(0);
});

test("deletes a build", async ({ openProjectPage, page }) => {
  await mockDeleteBuilds(page);
  const { buildList, modal } = await openProjectPage(project.id);

  await buildList.openMenu(finishedBuild.number);
  await buildList.menuItem("Delete").click();
  await expect(modal.dialog).toContainText(
    `Are you sure you want to delete build: #${finishedBuild.number}?`,
  );
  await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/builds/${finishedBuild.id}` &&
        request.method() === "DELETE",
    ),
    modal.confirmBtn.click(),
  ]);

  await expect(
    page.locator("#notistack-snackbar").filter({
      hasText: `Build #${finishedBuild.number} deleted`,
    }),
  ).toBeVisible();
  await expect(modal.dialog).toBeHidden();
});

test("lets go of a build once it is deleted", async ({
  openProjectPage,
  page,
}) => {
  await mockDeleteBuilds(page);
  const { buildList, modal } = await openProjectPage(
    project.id,
    finishedBuild.id,
  );

  await buildList.openMenu(finishedBuild.number);
  await buildList.menuItem("Delete").click();
  await modal.confirmBtn.click();

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === `/${project.id}` && !url.searchParams.has("buildId"),
  );
});

test("opens nothing by itself after a failed delete", async ({
  openProjectPage,
  page,
}) => {
  await mockApiError(
    page,
    (url) => url.pathname === `/builds/${finishedBuild.id}`,
    500,
    "Could not delete",
  );
  const { buildList, modal, notification } = await openProjectPage(project.id);

  await buildList.openMenu(finishedBuild.number);
  await buildList.menuItem("Delete").click();
  await modal.confirmBtn.click();
  await expect(notification.message).toHaveText("Could not delete");

  await buildList.openMenu(runningBuild.number);
  await expect(buildList.menu).toBeVisible();
  await expect(modal.dialog).toHaveCount(0);
});
