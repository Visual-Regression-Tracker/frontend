import { expect, Page } from "@playwright/test";
import { OpenProjectPage, test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import { TestStatus } from "~client/types/testStatus";
import {
  API_URL,
  fulfillBulk,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockTestRun,
} from "utils/mocks";
import { postData } from "utils/postData";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;

const VARIATION_EN = {
  ...TEST_UNRESOLVED,
  id: "variation-en",
  name: "Screen A",
  customTags: "en_US",
  diffPercent: 1,
};
const VARIATION_DE = {
  ...TEST_UNRESOLVED,
  id: "variation-de",
  name: "Screen A",
  customTags: "de_DE",
  diffPercent: 2,
};
const LONE_SCREEN = {
  ...TEST_UNRESOLVED,
  id: "lone",
  name: "Screen B",
  customTags: "en_US",
  diffPercent: 3,
};

const MANY_RUNS = ["Screen A", "Screen B"].flatMap((name, screenIndex) =>
  ["en_US", "de_DE", "fr_FR", "cs_CZ", "he_IL", "pl_PL"].map(
    (locale, localeIndex) => ({
      ...TEST_UNRESOLVED,
      id: `${screenIndex}-${locale}`,
      name,
      customTags: locale,
      diffPercent: localeIndex + 1,
    }),
  ),
);

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockGetTestRuns(page, build.id, [
    VARIATION_EN,
    VARIATION_DE,
    LONE_SCREEN,
  ]);
  await mockTestRun(page, VARIATION_EN);
  await mockTestRun(page, VARIATION_DE);
  await mockTestRun(page, LONE_SCREEN);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
});

const captureApprovals = async (page: Page): Promise<string[][]> => {
  const approved: string[][] = [];
  await page.route(
    `${API_URL}/test-runs/approve?merge=false`,
    (route, request) => {
      approved.push(postData<string[]>(request));
      return fulfillBulk(route);
    },
  );
  return approved;
};

const sorted = (ids: string[]) => [...ids].sort((a, b) => a.localeCompare(b));

const openGrouped = async (
  openProjectPage: OpenProjectPage,
  view: "table" | "grid",
) => {
  const projectPage = await openProjectPage(project.id, build.id);
  if (view === "grid") {
    await projectPage.testRunList.gridViewToggle.click();
  }
  await projectPage.testRunList.groupVariationsToggle.click();
  return projectPage;
};

test("collapses the variations of one screen into a single card", async ({
  openProjectPage,
}) => {
  const { testRunList } = await openGrouped(openProjectPage, "grid");

  await expect(testRunList.cards).toHaveCount(2);
  await expect(testRunList.cardGroupCount("Screen A")).toHaveText("2");
  await expect(testRunList.cardGroupCount("Screen B")).toBeHidden();
});

test("groups on request and forgets it after a reload", async ({
  openProjectPage,
  page,
}) => {
  const { testRunList } = await openProjectPage(project.id, build.id);
  await testRunList.gridViewToggle.click();
  await expect(testRunList.cards).toHaveCount(3);

  await testRunList.groupVariationsToggle.click();
  await expect(testRunList.cards).toHaveCount(2);

  await page.reload();
  await testRunList.gridViewToggle.click();

  await expect(testRunList.cards).toHaveCount(3);
  await expect(testRunList.groupVariationsToggle).not.toBeChecked();
});

test("selects every run in a group from its card", async ({
  openProjectPage,
  page,
}) => {
  const approved = await captureApprovals(page);
  const projectPage = await openGrouped(openProjectPage, "grid");

  await projectPage.testRunList.checkCard("Screen A");
  await expect(projectPage.testRunList.selectionBar).toContainText(
    "2 selected",
  );
  await projectPage.testRunList.approveBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "2 test runs approved.",
  );
  expect(approved.map(sorted)).toEqual([
    sorted([VARIATION_DE.id, VARIATION_EN.id]),
  ]);
});

test("walks the runs inside a group with the arrows", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openGrouped(openProjectPage, "grid");

  await projectPage.testRunList.getCard("Screen A").click();
  await expect(page).toHaveURL(new RegExp(`testId=${VARIATION_DE.id}$`));
  await expect(projectPage.detailsDialog).toBeVisible();

  await page.keyboard.press("ArrowRight");

  await expect(page).toHaveURL(new RegExp(`testId=${VARIATION_EN.id}$`));
});

test("does not leave the grid on a page that no longer exists", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, MANY_RUNS);
  const { testRunList } = await openProjectPage(project.id, build.id);
  await testRunList.gridViewToggle.click();
  await testRunList.nextPage.click();
  await expect(testRunList.cards).toHaveCount(2);

  await testRunList.groupVariationsToggle.click();

  await expect(testRunList.cards).toHaveCount(2);
});

test("counts cards, not the runs behind them, when grouped", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, MANY_RUNS);
  const { testRunList } = await openGrouped(openProjectPage, "grid");
  await expect(testRunList.cards).toHaveCount(2);

  await testRunList.selectAll.click();

  await expect(testRunList.selectionCount).toHaveText("2 cards selected");
});

test("collapses the variations into one table row too", async ({
  openProjectPage,
}) => {
  const { testRunList } = await openGrouped(openProjectPage, "table");

  await expect(testRunList.rows).toHaveCount(2);
  await expect(testRunList.rowGroupCount(VARIATION_DE.id)).toHaveText("2");
  await expect(
    testRunList.getColumn(VARIATION_DE.id, "tags"),
  ).not.toContainText("de_DE");
  await expect(testRunList.getColumn(LONE_SCREEN.id, "tags")).toContainText(
    "en_US",
  );

  await testRunList.groupVariationsToggle.click();

  await expect(testRunList.rows).toHaveCount(3);
  await expect(testRunList.getColumn(VARIATION_DE.id, "tags")).toContainText(
    "de_DE",
  );
});

test("selects a whole group from a table row", async ({
  openProjectPage,
  page,
}) => {
  const approved = await captureApprovals(page);
  const projectPage = await openGrouped(openProjectPage, "table");

  await projectPage.testRunList.checkRow(VARIATION_DE.id);
  await projectPage.testRunList.approveBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "2 test runs approved.",
  );
  expect(approved.map(sorted)).toEqual([
    sorted([VARIATION_DE.id, VARIATION_EN.id]),
  ]);
});

test("reaches a group's other runs from a table row", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openGrouped(openProjectPage, "table");

  await projectPage.testRunList.getRow(VARIATION_DE.id).click();
  await expect(page).toHaveURL(new RegExp(`testId=${VARIATION_DE.id}$`));
  await expect(projectPage.detailsDialog).toBeVisible();

  await page.keyboard.press("ArrowRight");

  await expect(page).toHaveURL(new RegExp(`testId=${VARIATION_EN.id}$`));
});

test("names the project's variation axis on the switch", async ({
  openProjectPage,
  page,
}) => {
  await mockGetProjects(page, [{ ...project, bulkApproveGroupBy: "viewport" }]);
  const { testRunList } = await openProjectPage(project.id, build.id);

  await testRunList.groupVariationsToggle.hover();

  await expect(testRunList.tooltip).toContainText("viewport");
});

test("shows the run left to review on a half-reviewed group, and the mix on hover", async ({
  openProjectPage,
  page,
}) => {
  const settled = { ...VARIATION_EN, status: TestStatus.approved };
  await mockGetTestRuns(page, build.id, [settled, VARIATION_DE, LONE_SCREEN]);
  await mockTestRun(page, settled);
  const { testRunList } = await openGrouped(openProjectPage, "grid");

  await expect(testRunList.cardGroupCount("Screen A")).toHaveText("2");
  await expect(testRunList.cardStatus("Screen A", "Unresolved")).toBeVisible();
  await expect(
    testRunList.cardBreakdown("Screen A", "1 unresolved · 1 approved"),
  ).toBeVisible();
});
