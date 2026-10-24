import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import {
  API_URL,
  mockApproveTestRuns,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockRejectTestRuns,
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
    TEST_RUN_NEW,
    TEST_RUN_APPROVED,
  ]);
  await mockTestRun(page, TEST_UNRESOLVED);
  await mockTestRun(page, TEST_RUN_NEW);
  await mockTestRun(page, TEST_RUN_APPROVED);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
  await mockApproveTestRuns(page);
  await mockRejectTestRuns(page);
});

const approvals = (request: { url: () => string; method: () => string }) =>
  request.url() === `${API_URL}/test-runs/approve?merge=false` &&
  request.method() === "POST";

const rejections = (request: { url: () => string; method: () => string }) =>
  request.url() === `${API_URL}/test-runs/reject` &&
  request.method() === "POST";

test("approves the run with A", async ({ openProjectPage, page }) => {
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await expect(details.drawAreas).toHaveCount(2);

  const [request] = await Promise.all([
    page.waitForRequest(approvals),
    page.keyboard.press("a"),
  ]);

  expect(request.postDataJSON()).toEqual([TEST_UNRESOLVED.id]);
  await expect(notification.message).toHaveText("Approved");
});

test("rejects the run with X", async ({ openProjectPage, page }) => {
  const { details, notification } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await expect(details.drawAreas).toHaveCount(2);

  const [request] = await Promise.all([
    page.waitForRequest(rejections),
    page.keyboard.press("x"),
  ]);

  expect(request.postDataJSON()).toEqual([TEST_UNRESOLVED.id]);
  await expect(notification.message).toHaveText("Rejected");
});

test("approves a new run with A too", async ({ openProjectPage, page }) => {
  const { details } = await openProjectPage(
    project.id,
    build.id,
    TEST_RUN_NEW.id,
  );
  await expect(details.approve).toBeVisible();

  const [request] = await Promise.all([
    page.waitForRequest(approvals),
    page.keyboard.press("a"),
  ]);

  expect(request.postDataJSON()).toEqual([TEST_RUN_NEW.id]);
});

test("asks to merge the baseline when the run says so", async ({
  openProjectPage,
  page,
}) => {
  const merging = { ...TEST_UNRESOLVED, merge: true };
  await mockTestRun(page, merging);
  await mockGetTestRuns(page, build.id, [merging]);
  const { details } = await openProjectPage(project.id, build.id, merging.id);
  await expect(details.drawAreas).toHaveCount(2);

  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/test-runs/approve?merge=true` &&
        request.method() === "POST",
    ),
    page.keyboard.press("a"),
  ]);

  expect(request.postDataJSON()).toEqual([merging.id]);
});

test("ignores A and X on a run that is already approved", async ({
  openProjectPage,
  page,
}) => {
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/test-runs/")) {
      sent.push(request.url());
    }
  });
  const { details } = await openProjectPage(
    project.id,
    build.id,
    TEST_RUN_APPROVED.id,
  );
  await expect(details.step).toBeVisible();
  await expect(details.approve).toHaveCount(0);

  // the keys are handled in order: once the dialog has moved on for the
  // arrow, the two before it have had their say. The hotkeys bind a moment
  // after the dialog shows, so the round is repeated until the arrow lands
  await expect(async () => {
    await page.keyboard.press("a");
    await page.keyboard.press("x");
    await page.keyboard.press("ArrowLeft");
    await expect(page).not.toHaveURL(
      new RegExp(`testId=${TEST_RUN_APPROVED.id}`),
      { timeout: 1000 },
    );
  }).toPass();
  expect(sent).toEqual([]);
});

test("does not approve, reject or toggle the diff while typing a comment", async ({
  openProjectPage,
  page,
}) => {
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/test-runs/")) {
      sent.push(request.url());
    }
  });
  const { details } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await expect(details.drawAreas).toHaveCount(2);
  await details.commentsBtn.click();

  await details.comment.fill("");
  await details.comment.press("a");
  await details.comment.press("x");
  await details.comment.press("d");

  await expect(details.comment).toHaveValue("axd");
  await expect(details.toggleDiff).toBeChecked();
  expect(sent).toEqual([]);
});

test("closes the dialog with Escape", async ({ openProjectPage, page }) => {
  const { details } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await expect(details.drawAreas).toHaveCount(2);
  await expect(page).toHaveURL(new RegExp(`testId=${TEST_UNRESOLVED.id}$`));

  await page.keyboard.press("Escape");

  await expect(details.drawAreas).toHaveCount(0);
  await expect(page).not.toHaveURL(/testId=/);
  // back on the build it was opened from
  await expect(page).toHaveURL(new RegExp(`buildId=${build.id}`));
});

// like the other keys, Escape belongs to the field being typed in
test("keeps the dialog open on Escape in the comment field", async ({
  openProjectPage,
  page,
}) => {
  const { details } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await expect(details.drawAreas).toHaveCount(2);
  await details.commentsBtn.click();

  await details.comment.press("Escape");
  // two frames on: a handled Escape would have closed the dialog by now
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );

  await expect(details.step).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`testId=${TEST_UNRESOLVED.id}$`));
});

test("steps between runs with the arrow keys", async ({
  openProjectPage,
  page,
}) => {
  const { details } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await expect(details.step).toHaveText(/^Step 1\/3:/);
  const first = page.url();

  await page.keyboard.press("ArrowRight");
  await expect(details.step).toHaveText(/^Step 2\/3:/);
  expect(page.url()).not.toBe(first);

  // the keys act on the run on screen, so wait for it before the next
  await page.keyboard.press("ArrowLeft");
  await expect(details.step).toHaveText(/^Step 1\/3:/);
  await expect(page).toHaveURL(first);
});

// the diff is on a run's checkpoint to begin with, and D takes it off to show
// the screenshot over its baseline
test("toggles the diff with D", async ({ openProjectPage, page }) => {
  const { details } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await expect(details.drawAreas).toHaveCount(2);
  await expect(details.toggleDiff).toBeChecked();
  await expect.poll(() => details.shownImage()).toBe("diff.png");

  await page.keyboard.press("d");

  await expect(details.toggleDiff).not.toBeChecked();
  await expect.poll(() => details.shownImage()).toBe("image.png");

  await page.keyboard.press("d");

  await expect(details.toggleDiff).toBeChecked();
  await expect.poll(() => details.shownImage()).toBe("diff.png");
});

test("keeps D and the switch in step", async ({ openProjectPage, page }) => {
  const { details } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await expect(details.drawAreas).toHaveCount(2);

  await page.keyboard.press("d");
  await expect.poll(() => details.shownImage()).toBe("image.png");
  await details.toggleDiff.check();

  await expect(details.toggleDiff).toBeChecked();
  await expect.poll(() => details.shownImage()).toBe("diff.png");
});

// NOTE: the hotkey library ignores keys typed into form fields, and the
// switch is one: after it has been clicked it holds focus, and D does nothing
// until focus moves elsewhere
test("ignores D while the diff switch holds focus", async ({
  openProjectPage,
  page,
}) => {
  const { details } = await openProjectPage(
    project.id,
    build.id,
    TEST_UNRESOLVED.id,
  );
  await expect(details.drawAreas).toHaveCount(2);
  await details.toggleDiff.uncheck();
  await expect.poll(() => details.shownImage()).toBe("image.png");

  await page.keyboard.press("d");
  // two frames on: a handled D would have re-rendered by now
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );

  await expect(details.toggleDiff).not.toBeChecked();
  expect(await details.shownImage()).toBe("image.png");
});

test("does nothing on D when the run has no diff", async ({
  openProjectPage,
  page,
}) => {
  const noDiff = { ...TEST_UNRESOLVED, diffName: null };
  await mockTestRun(page, noDiff);
  await mockGetTestRuns(page, build.id, [noDiff]);
  const { details } = await openProjectPage(project.id, build.id, noDiff.id);
  await expect(details.drawAreas).toHaveCount(2);
  await expect(details.toggleDiff).toHaveCount(0);
  await expect.poll(() => details.shownImage()).toBe("image.png");

  await page.keyboard.press("d");

  // the screenshot stays, and nothing makes it a diff
  await expect(details.toggleDiff).toHaveCount(0);
  await expect.poll(() => details.shownImage()).toBe("image.png");
});
