import { expect, type Page } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import { GO_TO_NEXT_KEY } from "~client/constants";
import { TestStatus } from "~client/types";
import {
  API_URL,
  isRevertUrl,
  mockApiError,
  mockApproveTestRuns,
  mockGetBuildDetails,
  fulfillBulk,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockRejectTestRuns,
  mockRevertTestRuns,
  reverts,
  revertDecision,
  mockTestRun,
} from "utils/mocks";
import { boxOf } from "utils/boxOf";

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
  await page.route(`${API_URL}/test-runs/approve?merge=false`, fulfillBulk);
  await mockRejectTestRuns(page);
});

const goToNextAfterDecision = (page: Page) =>
  page.addInitScript(
    (key) => localStorage.setItem(key, "true"),
    GO_TO_NEXT_KEY,
  );

const humanDecided = (status: TestStatus) => ({
  ...TEST_RUN_APPROVED,
  status,
});

test("raises its toast clear of the approve buttons", async ({
  openProjectPage,
}) => {
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await expect(details.approve).toBeVisible();
  const buttons = await boxOf(details.approve);

  await details.approve.click();

  await expect(notification.message).toBeVisible();
  const toast = await boxOf(notification.message);
  expect(toast.y + toast.height).toBeLessThanOrEqual(buttons.y);
});

test("replaces its confirmation rather than stacking them up", async ({
  openProjectPage,
}) => {
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );

  await details.approve.click();
  await details.approve.click();
  await details.approve.click();

  await expect(notification.toast("Approved")).toHaveCount(1);
});

test("keeps the confirmation with an undo up long enough to use it, then lets it go", async ({
  openProjectPage,
  page,
}) => {
  await goToNextAfterDecision(page);
  await page.clock.install();
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );

  await details.approve.click();
  await expect(notification.toast("Approved")).toBeVisible();

  await page.clock.runFor(5500);
  await expect(notification.toast("Approved")).toBeVisible();
  await page.clock.runFor(1500);
  await expect(notification.toast("Approved")).toBeHidden();
});

test("leaves the undo to the footer when staying on the run", async ({
  openProjectPage,
}) => {
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );

  await details.approve.click();

  await expect(notification.toast("Approved")).toBeVisible();
  await expect(notification.undoBtn("Approved")).toHaveCount(0);
});

test("undoes an approval from its toast when going to the next run", async ({
  openProjectPage,
  page,
}) => {
  await goToNextAfterDecision(page);
  await mockRevertTestRuns(page);
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await details.approve.click();

  const [request] = await Promise.all([
    page.waitForRequest(reverts),
    notification.undoBtn("Approved").click(),
  ]);

  expect(request.postDataJSON()).toEqual([TEST_UNRESOLVED.id]);
  expect(revertDecision(request)).toBe("approve");
  await expect(notification.toast("Undone")).toBeVisible();
  await expect(notification.toast("Approved")).toBeHidden();
});

test("shows why an undo from the toast was refused", async ({
  openProjectPage,
  page,
}) => {
  await goToNextAfterDecision(page);
  await mockApiError(
    page,
    isRevertUrl,
    409,
    "Test run was changed after the approval",
  );
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await details.reject.click();

  await notification.undoBtn("Rejected").click();

  await expect(
    notification.toast("Test run was changed after the approval"),
  ).toHaveClass(/notistack-MuiContent-error/);
  await expect(notification.toast("Undone")).toHaveCount(0);
});

for (const [status, decision] of [
  [TestStatus.approved, "approve"],
  [TestStatus.failed, "reject"],
] as const) {
  test(`undoes a ${status} run from the footer`, async ({
    openProjectPage,
    page,
  }) => {
    const decided = humanDecided(status);
    await mockGetTestRuns(page, build.id, [decided]);
    await mockTestRun(page, decided);
    await mockRevertTestRuns(page);
    const { details, notification } = await openProjectPage(
      project.id,
      build.id,
      decided.id,
    );
    await expect(details.approve).toHaveCount(0);
    const undo =
      decision === "approve" ? details.undoApproval : details.undoRejection;

    const [request] = await Promise.all([
      page.waitForRequest(reverts),
      undo.click(),
    ]);

    expect(request.postDataJSON()).toEqual([decided.id]);
    expect(revertDecision(request)).toBe(decision);
    await expect(notification.toast("Undone")).toBeVisible();
  });
}

test("shows why the footer undo was refused", async ({
  openProjectPage,
  page,
}) => {
  const decided = humanDecided(TestStatus.approved);
  await mockGetTestRuns(page, build.id, [decided]);
  await mockTestRun(page, decided);
  await mockApiError(
    page,
    isRevertUrl,
    409,
    `Test run ${decided.id}: a later approval changed this baseline`,
  );
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    decided.id,
  );

  await details.undoApproval.click();

  await expect(
    notification.toast("A later approval changed this baseline"),
  ).toHaveClass(/notistack-MuiContent-error/);
});

test("shows a toast when the API refuses the footer undo", async ({
  openProjectPage,
  page,
}) => {
  const decided = humanDecided(TestStatus.approved);
  await mockGetTestRuns(page, build.id, [decided]);
  await mockTestRun(page, decided);
  await mockApiError(page, isRevertUrl, 403, "Forbidden resource");
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    decided.id,
  );

  await details.undoApproval.click();

  await expect(notification.toast("Forbidden resource")).toHaveClass(
    /notistack-MuiContent-error/,
  );
});

test("offers no undo for an auto-approved run", async ({
  openProjectPage,
  page,
}) => {
  const auto = humanDecided(TestStatus.autoApproved);
  await mockGetTestRuns(page, build.id, [auto]);
  await mockTestRun(page, auto);
  const { details } = await openProjectPage(project.id, build.id, auto.id);
  await expect(details.step).toBeVisible();

  await expect(details.undoApproval).toHaveCount(0);
  await expect(details.undoRejection).toHaveCount(0);
});

test("lets an error outlive the confirmation that follows it", async ({
  openProjectPage,
  page,
}) => {
  await page.route(`${API_URL}/test-runs/reject`, (route) =>
    route.fulfill({ status: 500, body: JSON.stringify({ message: "nope" }) }),
  );
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );

  await details.reject.click();
  await expect(details.text("nope", { exact: true })).toBeVisible();
  await details.approve.click();

  await expect(details.text("nope", { exact: true })).toBeVisible();
  await expect(notification.toast("Approved")).toBeVisible();
});

test("leaves the edit mode and draw mode behind when moving to another run", async ({
  openProjectPage,
  page,
}) => {
  const { details } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  const { drawModeToggle: drawMode } = details;

  await details.editAreas.click();
  await drawMode.click();
  await expect(drawMode).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowLeft");

  await expect(page).toHaveURL(new RegExp(`testId=${TEST_RUN_NEW.id}$`));
  await expect(drawMode).toHaveCount(0);
  await details.editAreas.click();
  await expect(drawMode).toHaveAttribute("aria-pressed", "false");
});

test("does not dress a rejection up as a success", async ({
  openProjectPage,
}) => {
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );

  await details.reject.click();

  const toast = notification.toast("Rejected");
  await expect(toast).toBeVisible();
  await expect(toast).not.toHaveClass(/notistack-MuiContent-success/);
});

test("warns without an undo when someone else approved the run first", async ({
  openProjectPage,
  page,
}) => {
  const shown = "This test run is already approved";
  await mockApproveTestRuns(page, {
    succeeded: [],
    failed: [
      {
        id: TEST_UNRESOLVED.id,
        message: `Test run ${TEST_UNRESOLVED.id} is already approved`,
      },
    ],
  });
  const { notification, details } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );

  await details.approve.click();

  await expect(notification.toast(shown)).toHaveClass(
    /notistack-MuiContent-warning/,
  );
  await expect(notification.undoBtn(shown)).toHaveCount(0);
  await expect(details.text("Approved", { exact: true })).toHaveCount(0);
});
