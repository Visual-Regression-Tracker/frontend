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
import { TestStatus } from "~client/types/testStatus";
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
  await mockTestRun(page, TEST_RUN_NEW);
  await mockTestRun(page, TEST_RUN_OK);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
});

// same screen and branch, same on every axis but the locale, so these two are
// variations of one another; the third screen stands on its own
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

const mockVariations = async (page) => {
  await mockGetTestRuns(page, build.id, [
    VARIATION_EN,
    VARIATION_DE,
    LONE_SCREEN,
  ]);
  await mockTestRun(page, VARIATION_EN);
  await mockTestRun(page, VARIATION_DE);
  await mockTestRun(page, LONE_SCREEN);
};

test("collapses the variations of one screen into a single card", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.groupToggle.click();

  await expect(projectPage.testRunList.cards).toHaveCount(2);
  // the biggest diff represents the group
  await expect(
    projectPage.testRunList.getCard("Screen A").getByTestId("groupCount"),
  ).toHaveText("2");
  await expect(
    projectPage.testRunList.getCard("Screen B").getByTestId("groupCount"),
  ).toBeHidden();
});

test("groups on request and forgets it after a reload", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  // flat on arrival: grouping is off by default
  await expect(projectPage.testRunList.cards).toHaveCount(3);

  await projectPage.testRunList.groupToggle.click();
  await expect(projectPage.testRunList.cards).toHaveCount(2);

  await page.reload();
  // the reload lands on the table, so the grid has to be asked for again
  await projectPage.testRunList.gridViewToggle.click();

  await expect(projectPage.testRunList.cards).toHaveCount(3);
});

test("selects every run in a group from its card", async ({
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
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.groupToggle.click();

  await projectPage.testRunList.checkCard("Screen A");
  await projectPage.testRunList.approveBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "2 test runs processed.",
  );
  // the request order follows the flat sorted list and both share a name, so it
  // is a tie: what matters is that the whole group went out in one request
  expect(approved.map((ids) => [...ids].sort())).toEqual([
    [VARIATION_DE.id, VARIATION_EN.id].sort(),
  ]);
});

test("walks the runs inside a group with the arrows", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.groupToggle.click();

  await projectPage.testRunList.getCard("Screen A").click();
  await expect(page).toHaveURL(new RegExp(`testId=${VARIATION_DE.id}$`));

  await page.keyboard.press("ArrowRight");

  // the group's other locale comes before the next screen
  await expect(page).toHaveURL(new RegExp(`testId=${VARIATION_EN.id}$`));
});

// two screens across six locales each: twelve cards flat, two when grouped
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

test("does not leave the grid on a page that no longer exists", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, MANY_RUNS);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.nextPage.click();
  await expect(projectPage.testRunList.cards).toHaveCount(2);

  // grouping collapses twelve cards into two, so page two disappears
  await projectPage.testRunList.groupToggle.click();

  await expect(projectPage.testRunList.cards).toHaveCount(2);
});

// picked so that status, name and tag order are all different from one another
const SORTABLE = [
  { ...TEST_UNRESOLVED, id: "z", name: "Zebra", status: "new", device: "AAA" },
  { ...TEST_UNRESOLVED, id: "a", name: "Alpha", device: "ZZZ" },
  { ...TEST_UNRESOLVED, id: "m", name: "Mango", device: "MMM" },
];

test("sorts the cards by status or name", async ({ openProjectPage, page }) => {
  await mockGetTestRuns(page, build.id, SORTABLE);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  // needs attention first, then by name within a status
  expect(await projectPage.testRunList.cardNames()).toEqual([
    "Zebra",
    "Alpha",
    "Mango",
  ]);

  await projectPage.testRunList.sortBy("name");
  expect(await projectPage.testRunList.cardNames()).toEqual([
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

  expect(await projectPage.testRunList.cardNames()).toEqual([
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
  expect(await projectPage.testRunList.cardNames()).toEqual([
    "Alpha",
    "Mango",
    "Zebra",
  ]);

  await projectPage.testRunList.sortBy("name");

  expect(await projectPage.testRunList.cardNames()).toEqual([
    "Zebra",
    "Mango",
    "Alpha",
  ]);
});

test("selects every filtered run from the header, across pages", async ({
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
  await mockGetTestRuns(page, build.id, MANY_RUNS);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  // ten of the twelve cards fit on the page
  await expect(projectPage.testRunList.cards).toHaveCount(10);

  await projectPage.testRunList.selectAll.click();

  await expect(projectPage.testRunList.selectionCount).toHaveText(
    "12 cards selected",
  );

  await projectPage.testRunList.approveBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "12 test runs processed.",
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

  // the sort is not remembered: the table's resets too, and a remembered card
  // order left the two views opening on different columns
  expect(await projectPage.testRunList.cardNames()).toEqual([
    "Zebra",
    "Alpha",
    "Mango",
  ]);
});

test("renders", async ({ openProjectPage, page }) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.cards).toHaveCount(4);

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

test("opens the details dialog from a card", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await projectPage.testRunList.getCard(TEST_UNRESOLVED.name).click();

  await expect(page.getByTestId("drawArea").first()).toBeVisible();
});

test("resizes the grid cards with the density control", async ({
  openProjectPage,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  const card = projectPage.testRunList.cards.first();
  const standard = (await card.boundingBox()).width;

  await projectPage.testRunList.compactDensity.click();
  expect((await card.boundingBox()).width).toBeLessThan(standard);

  await projectPage.testRunList.comfortableDensity.click();
  expect((await card.boundingBox()).width).toBeGreaterThan(standard);
});

test("comes back to the standard density after a reload", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.compactDensity.click();

  await page.reload();

  await expect(projectPage.testRunList.standardDensity).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("applies the same density to the table rows", async ({
  openProjectPage,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  const row = projectPage.testRunList.getRow(TEST_UNRESOLVED.id);
  const standard = (await row.boundingBox()).height;

  await projectPage.testRunList.compactDensity.click();

  expect((await row.boundingBox()).height).toBeLessThan(standard);
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

test("navigates the dialog in the grid's order", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  // the data grid mounts first, since the view is not remembered, so the grid
  // has to replace the order it published
  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.grid).toBeVisible();

  // the grid sorts by status, so unresolved follows new. The runs arrive from
  // the API in a different order (unresolved, approved, new, ok), which is what
  // the dialog would walk if the grid did not publish its own order.
  // anchored: TEST_UNRESOLVED.id is a prefix of TEST_RUN_NEW.id, so an
  // unanchored pattern would match either run and prove nothing
  const openedRun = (id: string) => new RegExp(`testId=${id}$`);

  await projectPage.testRunList.getCard(TEST_RUN_NEW.name).click();
  await expect(page).toHaveURL(openedRun(TEST_RUN_NEW.id));

  await page.keyboard.press("ArrowRight");

  await expect(page).toHaveURL(openedRun(TEST_UNRESOLVED.id));
});

test("loads card images lazily", async ({ openProjectPage }) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await expect(
    projectPage.testRunList.cards.first().locator("img"),
  ).toHaveAttribute("loading", "lazy");
});

test("collapses the variations into one table row too", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.groupToggle.click();

  // grouped: the representative stands for both locales and carries the count
  await expect(projectPage.testRunList.rows).toHaveCount(2);
  await expect(
    projectPage.testRunList.getRow(VARIATION_DE.id).getByTestId("groupCount"),
  ).toHaveText("2");
  // the locale varies inside the group, so it is not shown as a tag of the row
  await expect(
    projectPage.testRunList.getColumn(VARIATION_DE.id, "tags"),
  ).not.toContainText("de_DE");

  await projectPage.testRunList.groupToggle.click();

  await expect(projectPage.testRunList.rows).toHaveCount(3);
  await expect(
    projectPage.testRunList.getColumn(VARIATION_DE.id, "tags"),
  ).toContainText("de_DE");
});

test("selects a whole group from a table row", async ({
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
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.groupToggle.click();

  await projectPage.testRunList.checkRow(VARIATION_DE.id);
  await projectPage.testRunList.approveBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "2 test runs processed.",
  );
  expect(approved.map((ids) => [...ids].sort())).toEqual([
    [VARIATION_DE.id, VARIATION_EN.id].sort(),
  ]);
});

test("reaches a group's other runs from a table row", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.groupToggle.click();

  await projectPage.testRunList.getRow(VARIATION_DE.id).click();
  await expect(page).toHaveURL(new RegExp(`testId=${VARIATION_DE.id}$`));

  await page.keyboard.press("ArrowRight");

  await expect(page).toHaveURL(new RegExp(`testId=${VARIATION_EN.id}$`));
});

test("keeps every tag on a row that stands for one run", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.groupToggle.click();

  // Screen B has no variations, so hiding its locale would lose information
  await expect(
    projectPage.testRunList.getColumn(LONE_SCREEN.id, "tags"),
  ).toContainText("en_US");
});

test("swaps the card image between the diff and the screenshot", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  const image = projectPage.testRunList.cards.first().locator("img");

  await expect(image).toHaveAttribute("src", /diff\.png/);

  // the hotkey first: clicking the switch leaves focus on its input, and
  // react-hotkeys-hook ignores keys typed inside form fields by design
  await page.keyboard.press("d");

  await expect(image).toHaveAttribute("src", /image\.png/);

  await projectPage.testRunList.diffToggle.click();

  await expect(image).toHaveAttribute("src", /diff\.png/);
});

test("shows the tags on the cards", async ({ openProjectPage, page }) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.groupToggle.click();

  // the lone screen keeps its locale, the group hides the axis it varies on
  await expect(projectPage.testRunList.getCard("Screen B")).toContainText(
    "en_US",
  );
  await expect(projectPage.testRunList.getCard("Screen A")).not.toContainText(
    "en_US",
  );
  // the fixture's device tag; the axes that do not vary stay on the card
  await expect(projectPage.testRunList.getCard("Screen A")).toContainText(
    "device",
  );
});

test("calls the things you tick cards, not rows", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);

  // MUI derives the button's aria-label from the tooltip's title
  await expect(
    page.getByLabel("Approve unresolved in selected rows."),
  ).toBeVisible();

  await projectPage.testRunList.gridViewToggle.click();

  await expect(
    page.getByLabel("Approve unresolved in selected cards."),
  ).toBeVisible();
  await expect(page.getByLabel("Delete selected cards.")).toBeVisible();
});

test("counts cards, not the runs behind them, when grouped", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, MANY_RUNS);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.groupToggle.click();
  // twelve runs collapse into two screens
  await expect(projectPage.testRunList.cards).toHaveCount(2);

  await projectPage.testRunList.selectAll.click();

  await expect(projectPage.testRunList.selectionCount).toHaveText(
    "2 cards selected",
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
      name: "Onboarding / ideal weight / metric units",
      os: "",
      browser: "",
      viewport: "",
      device: "iPhone",
      customTags: "Onboarding · ru_RU",
    },
  ]);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.compactDensity.click();

  // the tags stay on the narrowest card, and both run onto a second line
  // instead of ending in an ellipsis after two words
  await expect(projectPage.testRunList.cardTags.first()).toBeVisible();
  const oneLine = 24;
  expect(
    (await projectPage.testRunList.cardName.first().boundingBox()).height,
  ).toBeGreaterThan(oneLine);
  expect(
    (await projectPage.testRunList.cardTags.first().boundingBox()).height,
  ).toBeGreaterThan(oneLine);
});

test("shows the icon tooltips without the browser's delay", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);

  await projectPage.testRunList.gridViewToggle.hover();

  // a native title attribute has no tooltip role and no text in the DOM
  await expect(page.getByRole("tooltip")).toHaveText("Grid");
});

test("filters by a tag clicked on a card", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  // ungrouped, so that every card carries its own locale
  await expect(projectPage.testRunList.cards).toHaveCount(3);

  await projectPage.testRunList.clickTag("de_DE");

  await expect(projectPage.testRunList.cards).toHaveCount(1);
  // the filter bar answers for the click, so it can also be undone there
  await expect(projectPage.testRunFilters.selectedTag("de_DE")).toBeVisible();
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
  await expect(projectPage.testRunFilters.selectedTag("de_DE")).toBeHidden();
});

test("opens no dialog when a tag is clicked", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await projectPage.testRunList.clickTag("OS");

  await expect(page.getByTestId("drawArea")).toBeHidden();
});

test("names the axis the runs are grouped by in the tooltip", async ({
  openProjectPage,
  page,
}) => {
  await mockGetProjects(page, [{ ...project, bulkApproveGroupBy: "viewport" }]);
  const projectPage = await openProjectPage(project.id, build.id);

  await projectPage.testRunList.groupToggle.hover();

  await expect(page.getByRole("tooltip")).toContainText("viewport");
});

test("groups runs of one screen whose reviews are half done", async ({
  openProjectPage,
  page,
}) => {
  const settled = { ...VARIATION_EN, status: TestStatus.approved };
  await mockGetTestRuns(page, build.id, [settled, VARIATION_DE, LONE_SCREEN]);
  await mockTestRun(page, settled);
  await mockTestRun(page, VARIATION_DE);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.groupToggle.click();

  const screenA = projectPage.testRunList.getCard("Screen A");
  await expect(screenA.getByTestId("groupCount")).toHaveText("2");
  // the unresolved run represents the group, and the card owns up to the mix
  await expect(screenA.getByText("unresolved")).toBeVisible();
  await expect(
    screenA.locator('[title="1 unresolved · 1 approved"]'),
  ).toBeVisible();
});

// the data grid colours its own subtree, so the grid's chrome has to be told:
// left alone it inherits pure black from the body and reads heavier
const colourOf = (locator) =>
  locator.evaluate((el: HTMLElement) => getComputedStyle(el).color);

test("labels its switches in the table's colour", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  const label = page
    .locator(".MuiFormControlLabel-root .MuiTypography-root")
    .first();
  const inTable = await colourOf(label);

  await projectPage.testRunList.gridViewToggle.click();

  expect(await colourOf(label)).toBe(inTable);
});

test("labels its header in the table's colour", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  const inTable = await colourOf(
    page.locator(".MuiDataGrid-columnHeaderTitle").first(),
  );

  await projectPage.testRunList.gridViewToggle.click();

  expect(await colourOf(page.getByTestId("gridSort-name"))).toBe(inTable);
});
