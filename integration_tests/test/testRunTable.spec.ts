import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import { TestStatus } from "~client/types/testStatus";
import type { TestRun } from "~client/types";
import {
  API_URL,
  mockApproveTestRuns,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockImage,
  mockTestRunsWithDetails,
} from "utils/mocks";
import { afterTwoFrames } from "utils/afterTwoFrames";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;

const pad = (n: number) => String(n).padStart(2, "0");

const runsOf = (status: TestStatus, prefix: string, count: number): TestRun[] =>
  Array.from({ length: count }, (_, i) => ({
    ...TEST_UNRESOLVED,
    id: `${prefix}-${pad(i + 1)}`,
    name: `${prefix} ${pad(i + 1)}`,
    status,
  }));

const UNRESOLVED = runsOf(TestStatus.unresolved, "Login", 12);
const NEW = runsOf(TestStatus.new, "Profile", 5);
const APPROVED = runsOf(TestStatus.approved, "Cart", 4);
const OK = runsOf(TestStatus.ok, "Search", 4);
// served in reverse, so that the table order is the table's own doing
const ALL_RUNS = [...UNRESOLVED, ...NEW, ...APPROVED, ...OK].reverse();

const UNRESOLVED_IN_TABLE_ORDER = UNRESOLVED.map((run) => run.id).sort(
  (a: string, b: string) => a.localeCompare(b),
);

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockTestRunsWithDetails(page, build.id, ALL_RUNS);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
  await mockApproveTestRuns(page);
});

test("lists the runs that need attention first, ten to a page", async ({
  openProjectPage,
}) => {
  const { testRunList } = await openProjectPage(project.id, build.id);

  await expect(testRunList.rows).toHaveCount(10);
  await expect(testRunList.rowNames).toHaveText(
    [...NEW, ...UNRESOLVED].slice(0, 10).map((run) => run.name),
  );
});

test("narrows the table to the runs with the chosen status", async ({
  openProjectPage,
}) => {
  const { testRunList, testRunFilters } = await openProjectPage(
    project.id,
    build.id,
  );
  await expect(testRunList.rows).toHaveCount(10);

  await testRunFilters.selectStatus("unresolved");
  await expect(testRunList.rowNames).toHaveText(
    UNRESOLVED.slice(0, 10).map((run) => run.name),
  );

  await testRunList.tableNextPage.click();
  await expect(testRunList.rowNames).toHaveText(
    UNRESOLVED.slice(10).map((run) => run.name),
  );
});

test("walks only the filtered runs with the right arrow, in table order", async ({
  openProjectPage,
  page,
}) => {
  const { testRunList, testRunFilters, details } = await openProjectPage(
    project.id,
    build.id,
  );
  await testRunFilters.selectStatus("unresolved");
  await expect(testRunList.rows).toHaveCount(10);

  await testRunList.rowNames.first().click();

  const last = UNRESOLVED_IN_TABLE_ORDER.length;
  await expect(details.step).toHaveText(new RegExp(`^Step 1/${last}:`));
  await expect(page).toHaveURL(
    new RegExp(`testId=${UNRESOLVED_IN_TABLE_ORDER[0]}$`),
  );
  for (let index = 1; index < last; index++) {
    await page.keyboard.press("ArrowRight");

    await expect(details.step).toHaveText(
      new RegExp(`^Step ${index + 1}/${last}:`),
    );
    await expect(page).toHaveURL(
      new RegExp(`testId=${UNRESOLVED_IN_TABLE_ORDER[index]}$`),
    );
  }
});

test("stays on the last filtered run when the right arrow is pressed again", async ({
  openProjectPage,
  page,
}) => {
  const { testRunList, testRunFilters, details } = await openProjectPage(
    project.id,
    build.id,
  );
  await testRunFilters.selectStatus("unresolved");
  await expect(testRunList.rows).toHaveCount(10);
  await testRunList.tableNextPage.click();
  await expect(testRunList.rows).toHaveCount(2);
  await testRunList.rowNames.last().click();
  const last = UNRESOLVED_IN_TABLE_ORDER.length;
  await expect(details.step).toHaveText(new RegExp(`^Step ${last}/${last}:`));
  const lastUrl = page.url();

  await page.keyboard.press("ArrowRight");
  // two frames on: a handled arrow would have moved on by now
  await afterTwoFrames(page);

  await expect(details.step).toHaveText(new RegExp(`^Step ${last}/${last}:`));
  expect(page.url()).toBe(lastUrl);
  await page.keyboard.press("ArrowLeft");
  await expect(details.step).toHaveText(
    new RegExp(`^Step ${last - 1}/${last}:`),
  );
});

test("narrows the table to the runs whose name holds the text", async ({
  openProjectPage,
}) => {
  const { testRunList, testRunFilters } = await openProjectPage(
    project.id,
    build.id,
  );
  await expect(testRunList.rows).toHaveCount(10);

  await testRunFilters.name.fill("CART");

  await expect(testRunList.rowNames).toHaveText(
    APPROVED.map((run) => run.name),
  );
});

test("walks only the runs with the filtered name", async ({
  openProjectPage,
  page,
}) => {
  const { testRunList, testRunFilters, details } = await openProjectPage(
    project.id,
    build.id,
  );
  await testRunFilters.name.fill("cart");
  await expect(testRunList.rows).toHaveCount(APPROVED.length);

  await testRunList.rowNames.first().click();
  await expect(details.step).toHaveText(
    new RegExp(`^Step 1/${APPROVED.length}:`),
  );
  await page.keyboard.press("ArrowRight");

  await expect(details.step).toHaveText(
    new RegExp(`^Step 2/${APPROVED.length}:`),
  );
  await expect(page).toHaveURL(new RegExp(`testId=${APPROVED[1].id}$`));
});

test("ticks every filtered run across the pages with the header checkbox", async ({
  openProjectPage,
  page,
}) => {
  const { testRunList, testRunFilters, modal, notification } =
    await openProjectPage(project.id, build.id);
  await testRunFilters.selectStatus("unresolved");
  await expect(testRunList.rows).toHaveCount(10);

  await testRunList.selectAllRows.click();

  await expect(testRunList.tableSelectionCount).toHaveText(
    `${UNRESOLVED.length} rows selected`,
  );
  await testRunList.approveBtn.click();
  await expect(modal.dialog).toContainText(
    `Approve ${UNRESOLVED.length} test runs?`,
  );
  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/test-runs/approve?merge=false` &&
        request.method() === "POST",
    ),
    modal.confirmBtn.click(),
  ]);

  expect(
    [...request.postDataJSON()].sort((a: string, b: string) =>
      a.localeCompare(b),
    ),
  ).toEqual(UNRESOLVED_IN_TABLE_ORDER);
  await expect(notification.message).toHaveText(
    `${UNRESOLVED.length} test runs approved.`,
  );
});

test("clears the ticks when the header checkbox is unticked", async ({
  openProjectPage,
}) => {
  const { testRunList, testRunFilters } = await openProjectPage(
    project.id,
    build.id,
  );
  await testRunFilters.selectStatus("unresolved");
  await testRunList.selectAllRows.click();
  await expect(testRunList.tableSelectionCount).toBeVisible();

  // not uncheck(): the box settles after the click, which uncheck() reads as no change
  await testRunList.selectAllRows.click();

  await expect(testRunList.tableSelectionCount).toBeHidden();
});
