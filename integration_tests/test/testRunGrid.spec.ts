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
  // the table is one row per run, so it offers no grouping switch
  await expect(projectPage.testRunList.groupToggle).toBeHidden();

  await projectPage.testRunList.gridViewToggle.click();

  await expect(projectPage.testRunList.cards).toHaveCount(2);
  // the biggest diff represents the group
  await expect(
    projectPage.testRunList.getCard("Screen A").getByTestId("groupCount"),
  ).toHaveText("2");
  await expect(
    projectPage.testRunList.getCard("Screen B").getByTestId("groupCount"),
  ).toBeHidden();
});

test("flattens the cards when grouping is switched off", async ({
  openProjectPage,
  page,
}) => {
  await mockVariations(page);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.cards).toHaveCount(2);

  await projectPage.testRunList.groupToggle.click();
  await expect(projectPage.testRunList.cards).toHaveCount(3);

  await page.reload();

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
  await projectPage.testRunList.groupToggle.click();

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
  await projectPage.testRunList.groupToggle.click();
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
  await projectPage.testRunList.groupToggle.click();
  await projectPage.testRunList.nextPage.click();
  await expect(projectPage.testRunList.cards).toHaveCount(2);

  // grouping collapses twelve cards into two, so page two disappears
  await projectPage.testRunList.groupToggle.click();

  await expect(projectPage.testRunList.cards).toHaveCount(2);
});

// picked so that the three sort orders are all different from one another
const SORTABLE = [
  { ...TEST_UNRESOLVED, id: "z", name: "Zebra", status: "new", diffPercent: 1 },
  { ...TEST_UNRESOLVED, id: "a", name: "Alpha", diffPercent: 5 },
  { ...TEST_UNRESOLVED, id: "m", name: "Mango", diffPercent: 9 },
];

test("sorts the cards by status, name or diff", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, SORTABLE);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  // needs attention first, then by name within a status
  expect(await projectPage.testRunList.cardNames()).toEqual([
    "Zebra",
    "Alpha",
    "Mango",
  ]);

  await projectPage.testRunList.sortBy("Name");
  expect(await projectPage.testRunList.cardNames()).toEqual([
    "Alpha",
    "Mango",
    "Zebra",
  ]);

  await projectPage.testRunList.sortBy("Diff");
  expect(await projectPage.testRunList.cardNames()).toEqual([
    "Mango",
    "Alpha",
    "Zebra",
  ]);
});

test("flips the direction when the same field is picked again", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, SORTABLE);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();

  await projectPage.testRunList.sortBy("Name");
  expect(await projectPage.testRunList.cardNames()).toEqual([
    "Alpha",
    "Mango",
    "Zebra",
  ]);

  await projectPage.testRunList.sortBy("Name");

  expect(await projectPage.testRunList.cardNames()).toEqual([
    "Zebra",
    "Mango",
    "Alpha",
  ]);
});

test("keeps the chosen sort after a reload", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, SORTABLE);
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.sortBy("Name");

  await page.reload();

  expect(await projectPage.testRunList.cardNames()).toEqual([
    "Alpha",
    "Mango",
    "Zebra",
  ]);
});

test("renders", async ({ openProjectPage, page }) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await expect(projectPage.testRunList.cards).toHaveCount(4);

  await expect(page).toHaveScreenshot("test-run-grid.png");
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

test("keeps the chosen density after a reload", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, build.id);
  await projectPage.testRunList.gridViewToggle.click();
  await projectPage.testRunList.compactDensity.click();

  await page.reload();

  await expect(projectPage.testRunList.compactDensity).toHaveAttribute(
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
  await projectPage.testRunList.gridViewToggle.click();
  // reload with the grid already chosen, so the data grid never mounts and
  // cannot publish an order of its own
  await page.reload();
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
