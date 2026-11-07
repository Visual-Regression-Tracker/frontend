import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import {
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockImage,
  mockTestRunsWithDetails,
} from "utils/mocks";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;

const run = (id: string, overrides: Record<string, string>) => ({
  ...TEST_UNRESOLVED,
  id,
  name: `Screen ${id}`,
  os: "linux",
  browser: "chromium",
  viewport: "1280x800",
  device: "",
  customTags: "",
  ...overrides,
});

const LINUX_CHROME = run("a", {});
const LINUX_FIREFOX = run("b", { browser: "firefox" });
const MAC_CHROME = run("c", { os: "mac" });
const MAC_FIREFOX = run("d", { os: "mac", browser: "firefox" });

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockTestRunsWithDetails(page, build.id, [
    LINUX_CHROME,
    LINUX_FIREFOX,
    MAC_CHROME,
    MAC_FIREFOX,
  ]);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
});

test("offers a chip for each tag field the runs have, and none for an empty one", async ({
  openProjectPage,
}) => {
  const { testRunFilters } = await openProjectPage(project.id, build.id);

  await expect(testRunFilters.chip("os")).toBeVisible();
  await expect(testRunFilters.chip("browser")).toBeVisible();
  await expect(testRunFilters.chip("viewport")).toBeVisible();
  await expect(testRunFilters.chip("device")).toBeHidden();
});

test("keeps any picked value of a field and one value of every picked field", async ({
  openProjectPage,
}) => {
  const { testRunFilters, testRunList } = await openProjectPage(
    project.id,
    build.id,
  );
  await expect(testRunList.rows).toHaveCount(4);

  await testRunFilters.pick("os", "linux");
  await expect(testRunList.rows).toHaveCount(2);

  await testRunFilters.pick("os", "mac");
  await expect(testRunList.rows).toHaveCount(4);

  await testRunFilters.pick("browser", "firefox");
  await expect(testRunList.rows).toHaveCount(2);
  await expect(testRunFilters.chip("browser")).toHaveText("Browser: 1");
});

test("clears every filter with Clear filters", async ({ openProjectPage }) => {
  const { testRunFilters, testRunList } = await openProjectPage(
    project.id,
    build.id,
  );
  await testRunFilters.pick("os", "mac");
  await expect(testRunList.rows).toHaveCount(2);

  await testRunFilters.clearFilters.click();

  await expect(testRunList.rows).toHaveCount(4);
  await expect(testRunFilters.clearFilters).toBeHidden();
});

test("shows the selection bar for ticked rows and selects every run under the filter", async ({
  openProjectPage,
}) => {
  const { testRunFilters, testRunList } = await openProjectPage(
    project.id,
    build.id,
  );
  await testRunFilters.pick("os", "mac");
  await expect(testRunList.selectionBar).toBeHidden();

  await testRunList.checkRow(MAC_CHROME.id);
  await expect(testRunList.selectionBar).toContainText("1 selected");

  await testRunList.selectionBarSelectAll.click();
  await expect(testRunList.selectionBar).toContainText("2 selected");

  await testRunList.selectionBar
    .getByRole("button", { name: "Clear selection" })
    .click();
  await expect(testRunList.selectionBar).toBeHidden();
});

test("adds a Diff % column to the table", async ({ openProjectPage }) => {
  const { testRunList } = await openProjectPage(project.id, build.id);

  await expect(testRunList.getColumn(LINUX_CHROME.id, "diff")).toContainText(
    "%",
  );
});

test("keeps Show diff in step between the View menu and the grid toolbar", async ({
  openProjectPage,
}) => {
  const { testRunList } = await openProjectPage(project.id, build.id);
  await testRunList.gridViewToggle.click();
  await expect(testRunList.diffToggle).toBeChecked();

  await testRunList.viewMenuButton.click();
  await testRunList.page.getByTestId("viewMenuShowDiff").click();

  await expect(testRunList.diffToggle).not.toBeChecked();
});
