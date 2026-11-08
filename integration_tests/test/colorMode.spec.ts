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

const LIGHT = "rgb(244, 246, 249)";
const DARK = "rgb(17, 19, 24)";

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

test.describe("on a light system", () => {
  test.use({ colorScheme: "light" });

  test("starts light and switches to dark", async ({ projectListPage }) => {
    await expect(projectListPage.projects).toHaveCount(1);
    expect(await projectListPage.backgroundColor()).toBe(LIGHT);

    await projectListPage.header.colorModeToggle.click();

    await expect.poll(() => projectListPage.backgroundColor()).toBe(DARK);
    await expect(projectListPage.header.colorModeToggle).toHaveAccessibleName(
      "Switch to light mode",
    );
  });

  test("remembers the choice after a reload", async ({
    projectListPage,
    page,
  }) => {
    await expect(projectListPage.projects).toHaveCount(1);
    await projectListPage.header.colorModeToggle.click();
    await expect.poll(() => projectListPage.backgroundColor()).toBe(DARK);

    await page.reload();

    await expect(projectListPage.header.colorModeToggle).toBeVisible();
    expect(await projectListPage.backgroundColor()).toBe(DARK);
  });
});

test.describe("on a dark system", () => {
  test.use({ colorScheme: "dark" });

  test("follows the system until told otherwise", async ({
    projectListPage,
  }) => {
    await expect(projectListPage.projects).toHaveCount(1);
    expect(await projectListPage.backgroundColor()).toBe(DARK);

    await projectListPage.header.colorModeToggle.click();

    await expect.poll(() => projectListPage.backgroundColor()).toBe(LIGHT);
  });

  test("renders the project list", async ({ projectListPage, page }) => {
    await expect(projectListPage.projects).toHaveCount(1);
    await expect(page).toHaveScreenshot("projects-list-page-dark.png");
  });

  test("renders the project page and a test run", async ({
    openProjectPage,
    page,
  }) => {
    const projectPage = await openProjectPage(project.id);
    await projectPage.buildList
      .getBuildLocator(TEST_BUILD_FAILED.number)
      .click();

    await expect(page).toHaveScreenshot("project-page-dark.png");

    await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();
    // the dialog is a lazy chunk: wait for it like screens.spec does
    await expect(projectPage.details.step).toBeVisible();
    await expect(projectPage.details.drawAreas).toHaveCount(2);
    await expect(projectPage.details.diffMode).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await expect(page).toHaveScreenshot("test-run-details-dark.png");
  });
});
