import { expect } from "@playwright/test";
import { test } from "fixtures";
import { LoginPage, ProjectListPage } from "pages";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
} from "~client/_test/test.data.helper";
import {
  API_URL,
  mockApiError,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
} from "utils/mocks";

const project = TEST_PROJECT;

test.describe("an expired session", () => {
  test("logs out when a page load is unauthorized", async ({
    page,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    authUser,
  }) => {
    await mockApiError(page, `${API_URL}/projects`, 401, "Unauthorized");

    await page.goto("/projects");

    await expect(page).toHaveURL(/\/login$/);
    await expect(new LoginPage(page).loginForm).toBeVisible();
    expect(
      await page.evaluate(() => window.localStorage.getItem("user")),
    ).toBeNull();
  });

  test("logs out when an action is unauthorized", async ({
    page,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    authUser,
  }) => {
    await mockGetProjects(page, [project]);
    await mockApiError(
      page,
      `${API_URL}/projects/${project.id}`,
      401,
      "Unauthorized",
    );
    await page.goto("/projects");
    const projectListPage = new ProjectListPage(page);

    await projectListPage.deleteBtn.click();
    await projectListPage.modal.confirmBtn.click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(new LoginPage(page).loginForm).toBeVisible();
  });
});

test.describe("a failing API", () => {
  test("shows why the project list did not load", async ({
    page,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    authUser,
  }) => {
    await mockApiError(page, `${API_URL}/projects`, 500, "Database is down");

    await page.goto("/projects");
    const projectListPage = new ProjectListPage(page);

    await expect(projectListPage.notification.message).toHaveText(
      "Database is down",
    );
    // still logged in, and the page around the list is there
    await expect(page).toHaveURL(/\/projects$/);
    await expect(projectListPage.addBtn).toBeVisible();
    await expect(projectListPage.projects).toHaveCount(0);
  });

  test("shows why the builds did not load", async ({
    page,
    openProjectPage,
  }) => {
    await mockGetProjects(page, [project]);
    await mockApiError(
      page,
      (url) => url.origin === API_URL && url.pathname === "/builds",
      500,
      "Could not load builds",
    );

    const projectPage = await openProjectPage(project.id);

    await expect(projectPage.notification.message).toHaveText(
      "Could not load builds",
    );
    await expect(page).toHaveURL(new RegExp(`/${project.id}$`));
    await expect(projectPage.selectProject).toBeVisible();
    await expect(projectPage.buildList.searchInput).toBeVisible();
    // in place of the loading skeletons, not "No builds"
    await expect(projectPage.buildList.errorMessage).toBeVisible();
    await expect(projectPage.buildList.emptyMessage).toBeHidden();
  });

  test("stops loading when the test runs fail", async ({
    page,
    openProjectPage,
  }) => {
    await mockGetProjects(page, [project]);
    await mockGetBuilds(page, project.id, [TEST_BUILD_FAILED]);
    await mockGetBuildDetails(page, TEST_BUILD_FAILED);
    await mockApiError(
      page,
      `${API_URL}/test-runs?buildId=${TEST_BUILD_FAILED.id}`,
      500,
      "Could not load test runs",
    );

    const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);

    await expect(projectPage.notification.message).toHaveText(
      "Could not load test runs",
    );
    await expect(
      projectPage.testRunList.pane.getByRole("progressbar"),
    ).toHaveCount(0);
  });
});
