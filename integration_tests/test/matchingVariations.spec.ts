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
  mockApiError,
  mockApproveTestRuns,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockMatchingVariations,
  mockRejectTestRuns,
  mockTestRun,
} from "utils/mocks";
import { afterTwoFrames } from "utils/afterTwoFrames";

const project = { ...TEST_PROJECT, bulkApproveVariations: true };
const build = TEST_BUILD_FAILED;

const current: TestRun = { ...TEST_UNRESOLVED, customTags: "en" };
const sibling = (customTags: string, diffPercent: number): TestRun => ({
  ...current,
  id: `variation_${customTags}`,
  customTags,
  diffPercent,
});
const german = sibling("de", 3);
const french = sibling("fr", 2);
const spanish = {
  ...sibling("es", 9),
  reason: "The change is not the same",
};

const approvals = (request: { url: () => string; method: () => string }) =>
  request.url() === `${API_URL}/test-runs/approve?merge=false` &&
  request.method() === "POST";

const rejections = (request: { url: () => string; method: () => string }) =>
  request.url() === `${API_URL}/test-runs/reject` &&
  request.method() === "POST";

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockGetTestRuns(page, build.id, [current, german, french, spanish]);
  await mockTestRun(page, current);
  await mockMatchingVariations(page, current.id, [german, french], [spanish]);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
  await mockApproveTestRuns(page);
  await mockRejectTestRuns(page);
});

const openVariations = async (
  openProjectPage: (
    id: string,
    buildId?: string,
    testId?: string,
  ) => Promise<import("pages").ProjectPage>,
  verb: "Approve" | "Reject" = "Approve",
) => {
  const projectPage = await openProjectPage(project.id, build.id, current.id);
  const { details } = projectPage;
  await expect(details.step).toBeVisible();
  await (
    verb === "Approve" ? details.approveVariations : details.rejectVariations
  ).click();
  await expect(details.variationsToggleAll).toBeVisible();

  return projectPage;
};

test("offers the variations next to approve and reject", async ({
  openProjectPage,
}) => {
  const { details } = await openProjectPage(project.id, build.id, current.id);

  await expect(details.approve).toBeVisible();
  await expect(details.approveVariations).toBeVisible();
  await expect(details.rejectVariations).toBeVisible();
  await expect(details.reject).toBeVisible();
});

test("offers no variations while bulk approve is off", async ({
  openProjectPage,
  page,
}) => {
  await mockGetProjects(page, [{ ...project, bulkApproveVariations: false }]);
  const { details } = await openProjectPage(project.id, build.id, current.id);
  await expect(details.approve).toBeVisible();

  await expect(details.approveVariations).toHaveCount(0);
  await expect(details.rejectVariations).toHaveCount(0);
});

test("offers no variations when every sibling is settled", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, [
    current,
    { ...german, status: TestStatus.approved },
    { ...french, status: TestStatus.ok },
  ]);
  const { details } = await openProjectPage(project.id, build.id, current.id);
  await expect(details.approve).toBeVisible();

  await expect(details.approveVariations).toHaveCount(0);
});

test("offers no variations for a run that differs on another axis", async ({
  openProjectPage,
  page,
}) => {
  await mockGetTestRuns(page, build.id, [
    current,
    { ...german, device: "another device" },
  ]);
  const { details } = await openProjectPage(project.id, build.id, current.id);
  await expect(details.approve).toBeVisible();

  await expect(details.approveVariations).toHaveCount(0);
});

test("pre-selects the matching variations and leaves the others", async ({
  openProjectPage,
}) => {
  const { details } = await openVariations(openProjectPage);

  await expect(
    details.variations.getByText("Approve variations — review before applying"),
  ).toBeVisible();
  await expect(details.variationsToggleAll).toBeChecked();
  await expect(details.variationsToggleAll).toHaveAccessibleName(
    "2 of 2 matching selected",
  );
  await expect(details.variation("de")).toBeChecked();
  await expect(details.variation("fr")).toBeChecked();
  await expect(details.variationsToggleSkipped).not.toBeChecked();
  await expect(details.variationsToggleSkipped).toHaveAccessibleName(
    "1 didn't match — review separately",
  );
  await expect(details.variation("es")).not.toBeChecked();
  await expect(details.variations.getByText(spanish.reason)).toBeVisible();
  await expect(details.variationsConfirm("Approve")).toHaveText(
    "Approve 2 selected",
  );
});

test("approves the matching variations", async ({ openProjectPage, page }) => {
  const { details, notification } = await openVariations(openProjectPage);

  const [request] = await Promise.all([
    page.waitForRequest(approvals),
    details.variationsConfirm("Approve").click(),
  ]);

  expect(
    request.postDataJSON().sort((a: string, b: string) => a.localeCompare(b)),
  ).toEqual(
    [german.id, french.id].sort((a: string, b: string) => a.localeCompare(b)),
  );
  await expect(notification.message).toHaveText("Approved 2 variations");
  await expect(details.variations).toBeHidden();
});

test("approves only the variations left selected", async ({
  openProjectPage,
  page,
}) => {
  const { details } = await openVariations(openProjectPage);

  await details.variation("fr").uncheck();
  await expect(details.variationsConfirm("Approve")).toHaveText(
    "Approve 1 selected",
  );
  const [request] = await Promise.all([
    page.waitForRequest(approvals),
    details.variationsConfirm("Approve").click(),
  ]);

  expect(request.postDataJSON()).toEqual([german.id]);
});

test("approves a variation that did not match once it is ticked", async ({
  openProjectPage,
  page,
}) => {
  const { details } = await openVariations(openProjectPage);

  await details.variation("es").check();
  await expect(details.variationsConfirm("Approve")).toHaveText(
    "Approve 3 selected",
  );
  const [request] = await Promise.all([
    page.waitForRequest(approvals),
    details.variationsConfirm("Approve").click(),
  ]);

  expect(request.postDataJSON().sort()).toEqual(
    [german.id, french.id, spanish.id].sort((a: string, b: string) =>
      a.localeCompare(b),
    ),
  );
});

test("selects and clears every matching variation at once", async ({
  openProjectPage,
}) => {
  const { details } = await openVariations(openProjectPage);

  await details.variationsToggleAll.uncheck();

  await expect(details.variation("de")).not.toBeChecked();
  await expect(details.variation("fr")).not.toBeChecked();
  await expect(details.variationsConfirm("Approve")).toBeDisabled();
  await expect(details.variationsConfirm("Approve")).toHaveText(
    "Approve 0 selected",
  );

  await details.variationsToggleAll.check();

  await expect(details.variation("de")).toBeChecked();
  await expect(details.variation("fr")).toBeChecked();
  await expect(details.variationsConfirm("Approve")).toBeEnabled();
});

test("selects the variations that did not match all at once", async ({
  openProjectPage,
}) => {
  const { details } = await openVariations(openProjectPage);

  await details.variationsToggleSkipped.check();

  await expect(details.variation("es")).toBeChecked();
  await expect(details.variationsConfirm("Approve")).toHaveText(
    "Approve 3 selected",
  );
});

test("rejects the matching variations", async ({ openProjectPage, page }) => {
  const { details, notification } = await openVariations(
    openProjectPage,
    "Reject",
  );
  await expect(
    details.variations.getByText("Reject variations — review before applying"),
  ).toBeVisible();

  const [request] = await Promise.all([
    page.waitForRequest(rejections),
    details.variationsConfirm("Reject").click(),
  ]);

  expect(
    request.postDataJSON().sort((a: string, b: string) => a.localeCompare(b)),
  ).toEqual(
    [german.id, french.id].sort((a: string, b: string) => a.localeCompare(b)),
  );
  await expect(notification.message).toHaveText("Rejected 2 variations");
  await expect(details.variations).toBeHidden();
});

test("sends nothing when the review is cancelled", async ({
  openProjectPage,
  page,
}) => {
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/test-runs/")) {
      sent.push(request.url());
    }
  });
  const { details } = await openVariations(openProjectPage);

  await details.variationsCancel.click();

  await expect(details.variations).toBeHidden();
  await expect(details.step).toBeVisible();
  expect(sent).toEqual([]);
});

test("leaves the run behind alone on its hotkeys while the review is open", async ({
  openProjectPage,
  page,
}) => {
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/test-runs/")) {
      sent.push(request.url());
    }
  });
  const { details } = await openVariations(openProjectPage);
  await details.variationsToggleAll.focus();

  for (const key of ["a", "x", "d", "ArrowRight", "ArrowLeft"]) {
    await page.keyboard.press(key);
  }
  // two frames on: a handled key would have re-rendered by now
  await afterTwoFrames(page);

  expect(sent).toEqual([]);
  await expect(page).toHaveURL(new RegExp(`testId=${current.id}$`));
  await details.variationsCancel.click();
  await expect(details.variations).toBeHidden();
  await expect(details.toggleDiff).toBeChecked();
});

test("keeps the review open and says so when approving fails", async ({
  openProjectPage,
  page,
}) => {
  await mockApiError(
    page,
    (url) => url.pathname === "/test-runs/approve",
    500,
    "Could not approve",
  );
  const { details, notification } = await openVariations(openProjectPage);

  await details.variationsConfirm("Approve").click();

  await expect(notification.message).toHaveText("Could not approve");
  await expect(details.variations).toBeVisible();
  await expect(details.variationsConfirm("Approve")).toHaveText(
    "Approve 2 selected",
  );
});

test("shows the diffs, and the screenshots when the diff is switched off", async ({
  openProjectPage,
}) => {
  const { details } = await openVariations(openProjectPage);
  await expect(details.variationsShowDiff).toBeChecked();
  await expect(details.variationThumbnails).toHaveCount(3);
  for (const thumbnail of await details.variationThumbnails.all()) {
    await expect(thumbnail).toHaveAttribute("src", /\/diff\.png$/);
  }

  await details.variationsShowDiff.uncheck();

  for (const thumbnail of await details.variationThumbnails.all()) {
    await expect(thumbnail).toHaveAttribute("src", /\/image\.png$/);
  }
});

test("opens a variation full size", async ({ openProjectPage, page }) => {
  const { details } = await openVariations(openProjectPage);

  await details.variations
    .getByRole("button", { name: "View de full size" })
    .click();

  await expect(page.getByAltText("baseline")).toBeVisible();
  await expect(page.getByAltText("checkpoint")).toBeVisible();
});
