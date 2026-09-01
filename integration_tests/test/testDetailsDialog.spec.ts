import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
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
  await mockGetTestRuns(page, build.id, [TEST_UNRESOLVED]);
  await mockTestRun(page, TEST_UNRESOLVED);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
  await page.route(`${API_URL}/test-runs/approve?merge=false`, (route) =>
    route.fulfill({ status: 200, body: "[]" }),
  );
});

// The app anchors toasts bottom-centre, which is clear of both paginations on
// the list. The dialog puts its approve/reject bar in exactly that spot, so a
// toast there lands on the buttons and blocks the next screen's approval until
// it times out or is dismissed.
test("raises its toast clear of the approve buttons", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  // by text, not by role name: the tooltip wrapper makes "Hotkey: A" the
  // button's accessible name. Anchored so "Approve variations" cannot match.
  const approve = page.locator("button").filter({ hasText: /^Approve$/ });
  await expect(approve).toBeVisible();
  const buttons = await approve.boundingBox();

  await approve.click();

  await expect(projectPage.notification.message).toBeVisible();
  const toast = await projectPage.notification.message.boundingBox();
  expect(toast.y + toast.height).toBeLessThanOrEqual(buttons.y);
});

// A screen now takes a couple of seconds to review and a toast lives five, so
// approving one after another piles them up over the checkpoint's header.
test("replaces its confirmation rather than stacking them up", async ({
  openProjectPage,
  page,
}) => {
  await openProjectPage(project.id, build.id, TEST_UNRESOLVED.id);
  const approve = page.locator("button").filter({ hasText: /^Approve$/ });

  await approve.click();
  await approve.click();
  await approve.click();

  await expect(page.getByText("Approved")).toHaveCount(1);
});

// notistack's default is five seconds, which outlives the screen the
// confirmation belongs to and leaves one sitting over the header for good.
test("lets the confirmation go before the next screen is reviewed", async ({
  openProjectPage,
  page,
}) => {
  await openProjectPage(project.id, build.id, TEST_UNRESOLVED.id);

  await page
    .locator("button")
    .filter({ hasText: /^Approve$/ })
    .click();

  await expect(page.getByText("Approved")).toBeVisible();
  // comfortably past a two-second toast, comfortably short of a five-second one
  await expect(page.getByText("Approved")).toBeHidden({ timeout: 3500 });
});

// Errors are not interchangeable the way the confirmations are: a failure must
// not be swallowed by whatever the reviewer does next.
test("lets an error outlive the confirmation that follows it", async ({
  openProjectPage,
  page,
}) => {
  await page.route(`${API_URL}/test-runs/reject`, (route) =>
    route.fulfill({ status: 500, body: JSON.stringify({ message: "nope" }) }),
  );
  await openProjectPage(project.id, build.id, TEST_UNRESOLVED.id);

  await page
    .locator("button")
    .filter({ hasText: /^Reject$/ })
    .click();
  await expect(page.getByText("nope")).toBeVisible();
  await page
    .locator("button")
    .filter({ hasText: /^Approve$/ })
    .click();

  await expect(page.getByText("nope")).toBeVisible();
  await expect(page.getByText("Approved")).toBeVisible();
});
