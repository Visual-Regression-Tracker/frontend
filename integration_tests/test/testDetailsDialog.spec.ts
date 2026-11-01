import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_NEW,
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
  await mockGetTestRuns(page, build.id, [TEST_UNRESOLVED, TEST_RUN_NEW]);
  await mockTestRun(page, TEST_UNRESOLVED);
  await mockTestRun(page, TEST_RUN_NEW);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
  await page.route(`${API_URL}/test-runs/approve?merge=false`, (route) =>
    route.fulfill({ status: 200, body: "[]" }),
  );
});

test("raises its toast clear of the approve buttons", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  // by text: the tooltip wrapper makes "Hotkey: A" the name; anchored vs "Approve variations"
  const approve = page.locator("button").filter({ hasText: /^Approve$/ });
  await expect(approve).toBeVisible();
  const buttons = await approve.boundingBox();

  await approve.click();

  await expect(projectPage.notification.message).toBeVisible();
  const toast = await projectPage.notification.message.boundingBox();
  expect(toast.y + toast.height).toBeLessThanOrEqual(buttons.y);
});

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
  // past a two-second toast, short of notistack's five-second default
  await expect(page.getByText("Approved")).toBeHidden({ timeout: 3500 });
});

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

test("leaves draw mode behind when moving to another run", async ({
  openProjectPage,
  page,
}) => {
  await openProjectPage(project.id, build.id, TEST_UNRESOLVED.id);
  // an unlabelled icon: found by the value MUI puts on the button
  const drawMode = page.locator('button[value="drawMode"]');

  await drawMode.click();
  await expect(drawMode).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowLeft");

  await expect(page).toHaveURL(new RegExp(`testId=${TEST_RUN_NEW.id}$`));
  await expect(drawMode).toHaveAttribute("aria-pressed", "false");
});

test("does not dress a rejection up as a success", async ({
  openProjectPage,
  page,
}) => {
  await page.route(`${API_URL}/test-runs/reject`, (route) =>
    route.fulfill({ status: 200, body: "[]" }),
  );
  const projectPage = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );

  await page
    .locator("button")
    .filter({ hasText: /^Reject$/ })
    .click();

  const toast = projectPage.notification.toast("Rejected");
  await expect(toast).toBeVisible();
  await expect(toast).not.toHaveClass(/notistack-MuiContent-success/);
});
