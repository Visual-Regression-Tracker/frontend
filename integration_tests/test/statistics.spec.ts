import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_VARIATION_ONE,
} from "~client/_test/test.data.helper";
import { ProjectStatisticsPage } from "pages";
import {
  API_URL,
  mockGetBuilds,
  mockGetProjects,
  mockGetStatisticsResults,
  mockGetTestVariations,
} from "utils/mocks";
import { buildResult } from "~client/_test/statistics.fixture";
import { STATISTICS_BUILDS } from "utils/statistics";

const project = TEST_PROJECT;

test.beforeEach(async ({ page, authUser }) => {
  void authUser;
  await mockGetProjects(page, [project]);
  await mockGetTestVariations(page, project.id, [
    TEST_VARIATION_ONE,
    { ...TEST_VARIATION_ONE, id: "v2", branchName: "feature" },
  ]);
  await mockGetStatisticsResults(page, project.id, STATISTICS_BUILDS);
});

test("shows a bar per kept build and the build limit", async ({ page }) => {
  await page.goto(`/statistics/${project.id}`);
  const statistics = new ProjectStatisticsPage(page);

  await expect(statistics.links).toHaveCount(12);
  await expect(statistics.text("12 builds kept (limit 100)")).toBeVisible();
  await expect(statistics.bar("Build #4")).toHaveAccessibleName(
    "Build #4: 20 runs (12 passed, 2 unresolved, 6 failed)",
  );
});

test("a bar tells the counts per status on hover", async ({ page }) => {
  await page.goto(`/statistics/${project.id}`);
  const statistics = new ProjectStatisticsPage(page);

  await statistics.bar("Build #4").hover();

  const { tooltip } = statistics;
  await expect(tooltip).toContainText("Build #4");
  await expect(tooltip).toContainText("Failed");
  await expect(tooltip).toContainText("6");
});

test("a bar opens the build on the Builds tab", async ({ page }) => {
  await mockGetBuilds(page, project.id, [TEST_BUILD_FAILED]);
  await page.goto(`/statistics/${project.id}`);
  const statistics = new ProjectStatisticsPage(page);

  await statistics.bar("Build #4").click();

  await expect(page).toHaveURL(new RegExp(`/${project.id}\\?buildId=build-4$`));
});

test("choosing a branch shows only its builds", async ({ page }) => {
  await page.route(
    `${API_URL}/statistics/results?projectId=${project.id}&branchName=feature`,
    (route) =>
      route.fulfill({
        body: JSON.stringify([buildResult(21, { ok: 3 }, "feature")]),
      }),
  );
  await page.goto(`/statistics/${project.id}`);
  const statistics = new ProjectStatisticsPage(page);
  await expect(statistics.links).toHaveCount(12);

  await statistics.branchSelect.click();
  await statistics.option("feature").click();

  await expect(statistics.links).toHaveCount(1);
  await expect(statistics.text("1 build kept (limit 100)")).toBeVisible();
});
