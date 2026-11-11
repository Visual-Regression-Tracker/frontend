import { expect, Page } from "@playwright/test";
import { OpenProjectPage, test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
  TEST_RUN_OK,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import { TestStatus } from "~client/types/testStatus";
import {
  API_URL,
  mockGetBuildDetails,
  fulfillBulk,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockTestRun,
} from "utils/mocks";
import { boxOf } from "utils/boxOf";
import { postData } from "utils/postData";

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
  await mockTestRun(page, TEST_RUN_NEW);
  await mockTestRun(page, TEST_RUN_OK);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
});

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

const mockVariations = async (page: Page) => {
  await mockGetTestRuns(page, build.id, [
    VARIATION_EN,
    VARIATION_DE,
    LONE_SCREEN,
  ]);
  await mockTestRun(page, VARIATION_EN);
  await mockTestRun(page, VARIATION_DE);
  await mockTestRun(page, LONE_SCREEN);
};

const openVariationGrid = async (
  openProjectPage: OpenProjectPage,
  page: Page,
) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  return projectPage;
};

test("forgets what was selected once a bulk action has run", async ({
  openProjectPage,
  page,
}) => {
  const approved = await captureApprovals(page);
  const projectPage = await openVariationGrid(openProjectPage, page);

  await projectPage.testRunList.checkCard("de_DE");
  await projectPage.testRunList.approveBtn.click();
  await projectPage.modal.confirmBtn.click();
  await expect.poll(() => approved.length).toBe(1);

  // approved runs must leave the selection or they would be counted and sent again
  await expect(projectPage.testRunList.selectionCount).toBeHidden();

  await projectPage.testRunList.checkCard("Screen B");
  await projectPage.testRunList.approveBtn.click();
  await expect(projectPage.text("Approve 1 test run?")).toBeVisible();
  await projectPage.modal.confirmBtn.click();

  await expect.poll(() => approved.length).toBe(2);
  expect(approved[1]).toEqual([LONE_SCREEN.id]);
});

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

test("pages through the cards", async ({ openProjectPage, page }) => {
  await mockGetTestRuns(page, build.id, MANY_RUNS);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await expect(projectPage.testRunList.cards).toHaveCount(10);

  await projectPage.testRunList.nextPage.click();

  await expect(projectPage.testRunList.cards).toHaveCount(2);
});

test("shows more cards per page on request", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, MANY_RUNS);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.cards).toHaveCount(10);

  await projectPage.testRunList.setPageSize(30);

  await expect(projectPage.testRunList.cards).toHaveCount(12);
});

const SORTABLE = [
  {
    ...TEST_UNRESOLVED,
    id: "z",
    name: "Zebra",
    status: TestStatus.new,
    device: "AAA",
  },
  { ...TEST_UNRESOLVED, id: "a", name: "Alpha", device: "ZZZ" },
  { ...TEST_UNRESOLVED, id: "m", name: "Mango", device: "MMM" },
];

test("sorts the cards by status or name", async ({ openProjectPage, page }) => {
  await mockGetTestRuns(page, build.id, SORTABLE);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await expect(projectPage.testRunList.cardNames).toHaveText([
    "Zebra",
    "Alpha",
    "Mango",
  ]);

  await projectPage.testRunList.sortBy("name");
  await expect(projectPage.testRunList.cardNames).toHaveText([
    "Alpha",
    "Mango",
    "Zebra",
  ]);
});

test("sorts the cards by tag as the table's column does", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, SORTABLE);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await projectPage.testRunList.sortBy("tags");

  await expect(projectPage.testRunList.cardNames).toHaveText([
    "Zebra",
    "Mango",
    "Alpha",
  ]);
});

test("flips the direction when the same field is picked again", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, SORTABLE);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await projectPage.testRunList.sortBy("name");
  await expect(projectPage.testRunList.cardNames).toHaveText([
    "Alpha",
    "Mango",
    "Zebra",
  ]);

  await projectPage.testRunList.sortBy("name");

  await expect(projectPage.testRunList.cardNames).toHaveText([
    "Zebra",
    "Mango",
    "Alpha",
  ]);
});

test("selects every filtered run from the header, across pages", async ({
  openProjectPage,
  page,
}) => {
  const approved = await captureApprovals(page);
  await mockGetTestRuns(page, build.id, MANY_RUNS);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.cards).toHaveCount(10);

  await projectPage.testRunList.selectAll.click();

  await expect(projectPage.testRunList.selectionCount).toHaveText(
    "12 cards selected",
  );

  await projectPage.testRunList.approveBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "12 test runs approved.",
  );
  expect(approved[0]).toHaveLength(MANY_RUNS.length);
});

test("clears the selection when the header box is unticked", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, MANY_RUNS);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.selectAll.click();
  await expect(projectPage.testRunList.selectionCount).toBeVisible();

  await projectPage.testRunList.selectAll.click();

  await expect(projectPage.testRunList.selectionCount).toBeHidden();
});

test("opens on the status order, like the table", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, SORTABLE);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.sortBy("name");

  await page.reload();
  await projectPage.testRunList.gridViewToggle.click();

  await expect(projectPage.testRunList.cardNames).toHaveText([
    "Zebra",
    "Alpha",
    "Mango",
  ]);
});

test("renders", async ({ openProjectPage, page }) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.cards).toHaveCount(4);

  await page.mouse.move(0, 0);
  await expect(projectPage.tooltip).toHaveCount(0);
  await expect(page).toHaveScreenshot("test-run-grid.png");
});

test("switches to the grid and comes back to the table after a reload", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);

  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.grid).toBeVisible();

  await page.reload();

  await expect(projectPage.testRunList.grid).toBeHidden();
  await expect(projectPage.testRunList.rows.first()).toBeVisible();
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

test("opens the details dialog from a card", async ({ openProjectPage }) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await projectPage.testRunList.getCard(TEST_UNRESOLVED.name).click();

  await expect(projectPage.details.drawAreas.first()).toBeVisible();
});

test("approves the runs selected in the grid", async ({
  openProjectPage,
  page,
}) => {
  const approved = await captureApprovals(page);

  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  // approved runs are not eligible (idsEligibleForApproveOrReject), so they would prove nothing
  await projectPage.testRunList.checkCard(TEST_RUN_NEW.name);
  await projectPage.testRunList.checkCard(TEST_UNRESOLVED.name);
  await projectPage.testRunList.approveBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "2 test runs approved.",
  );
  expect(approved).toEqual([[TEST_RUN_NEW.id, TEST_UNRESOLVED.id]]);
});

test("navigates the dialog in the grid's order", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.grid).toBeVisible();

  // anchored: TEST_UNRESOLVED.id is a prefix of TEST_RUN_NEW.id
  const openedRun = (id: string) => new RegExp(`testId=${id}$`);

  await projectPage.testRunList.getCard(TEST_RUN_NEW.name).click();
  await expect(page).toHaveURL(openedRun(TEST_RUN_NEW.id));
  await expect(projectPage.detailsDialog).toBeVisible();

  await page.keyboard.press("ArrowRight");

  await expect(page).toHaveURL(openedRun(TEST_UNRESOLVED.id));
});

test("loads card images lazily", async ({ openProjectPage }) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await expect(projectPage.testRunList.firstCardImage).toHaveAttribute(
    "loading",
    "lazy",
  );
});

test("shows the diff on the cards, and d leaves it there", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openVariationGrid(openProjectPage, page);
  const image = projectPage.testRunList.firstCardImage;
  await expect(image).toHaveAttribute("src", /diff\.png/);

  await page.keyboard.press("d");

  await expect(image).toHaveAttribute("src", /diff\.png/);
});

test("shows every tag on the cards, variations included", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openVariationGrid(openProjectPage, page);

  await expect(projectPage.testRunList.cards).toHaveCount(3);
  await expect(projectPage.testRunList.getCard("de_DE")).toContainText(
    "device",
  );
  await expect(projectPage.testRunList.getCard("Screen B")).toContainText(
    "en_US",
  );
});

test("wraps a long name and its tags rather than cutting them off", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, [
    {
      ...TEST_UNRESOLVED,
      id: "long",
      name: "Onboarding / ideal weight / metric units / imperial fallback",
      os: "",
      browser: "",
      viewport: "",
      device: "iPhone",
      customTags: "Onboarding · ru_RU · dark theme · large text",
    },
  ]);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await expect(projectPage.testRunList.cardTags.first()).toBeVisible();
  const oneLine = 24;
  expect(
    (await boxOf(projectPage.testRunList.cardNames.first())).height,
  ).toBeGreaterThan(oneLine);
  expect(
    (await boxOf(projectPage.testRunList.cardTags.first())).height,
  ).toBeGreaterThan(oneLine);
});

test("shows the icon tooltips without the browser's delay", async ({
  openProjectPage,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);

  await projectPage.testRunList.gridViewToggle.hover();

  // a native title has no tooltip role and no DOM text
  await expect(projectPage.tooltip).toHaveText("Grid");
});

test("filters by a tag clicked on a card", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.cards).toHaveCount(3);

  await projectPage.testRunList.clickTag("de_DE");

  await expect(projectPage.testRunList.cards).toHaveCount(1);
  await expect(projectPage.testRunFilters.chip("customTags")).toHaveText(
    "Tags: 1",
  );
});

test("filters only the field of the clicked tag", async ({
  openProjectPage,
  page,
}) => {
  const onDevice = { ...TEST_UNRESOLVED, id: "on-device", device: "Chrome" };
  const inBrowser = { ...TEST_RUN_NEW, id: "in-browser", browser: "Chrome" };
  await mockGetTestRuns(page, build.id, [onDevice, inBrowser, TEST_RUN_OK]);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.cards).toHaveCount(3);

  await projectPage.testRunList.clickTag("Chrome");

  await expect(projectPage.testRunList.cards).toHaveCount(1);
});

test("clears the tag when it is clicked a second time", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.clickTag("de_DE");
  await expect(projectPage.testRunList.cards).toHaveCount(1);

  await projectPage.testRunList.clickTag("de_DE");

  await expect(projectPage.testRunList.cards).toHaveCount(3);
  await expect(projectPage.testRunFilters.chip("customTags")).toHaveText(
    "Tags",
  );
});

test("opens no dialog when a tag is clicked", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await projectPage.testRunList.clickTag("OS");

  await expect(projectPage.details.drawAreas).toBeHidden();
});

test("labels its header in the table's colour", async ({ openProjectPage }) => {
  const projectPage = await openProjectPage(project.id, build.id);
  const inTable = await projectPage.testRunList.tableHeaderColour();

  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.grid).toBeVisible();

  expect(await projectPage.testRunList.gridSortNameColour()).toBe(inTable);
});
