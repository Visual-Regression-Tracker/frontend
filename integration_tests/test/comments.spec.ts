import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import {
  API_URL,
  mockApiError,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockTestRun,
  mockUpdateTestRun,
} from "utils/mocks";
import { afterTwoFrames } from "utils/afterTwoFrames";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;
const testRun = TEST_UNRESOLVED;

const commentUpdates = (request: { url: () => string; method: () => string }) =>
  request.url() === `${API_URL}/test-runs/update/${testRun.id}` &&
  request.method() === "PATCH";

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockGetTestRuns(page, build.id, [testRun]);
  await mockTestRun(page, testRun);
  await mockUpdateTestRun(page, testRun);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
});

const openDialog = async (
  openProjectPage: (
    id: string,
    buildId?: string,
    testId?: string,
  ) => Promise<import("pages").ProjectPage>,
) => {
  const projectPage = await openProjectPage(project.id, build.id, testRun.id);
  await expect(projectPage.details.step).toBeVisible();

  return projectPage;
};

test("opens on the comment the run already has", async ({
  openProjectPage,
}) => {
  const { details } = await openDialog(openProjectPage);
  await expect(details.comment).toBeHidden();

  await details.commentsBtn.click();

  await expect(details.comment).toHaveValue(testRun.comment);
});

test("saves a comment", async ({ openProjectPage, page }) => {
  const { details, notification } = await openDialog(openProjectPage);
  await details.commentsBtn.click();

  await details.comment.fill("Looks wrong on the footer");
  const [request] = await Promise.all([
    page.waitForRequest(commentUpdates),
    details.commentSaveBtn.click(),
  ]);

  expect(request.postDataJSON()).toEqual({
    comment: "Looks wrong on the footer",
  });
  await expect(notification.message).toHaveText("Comment updated");
  await expect(details.comment).toBeHidden();
});

test("lets the comment confirmation go after two seconds", async ({
  openProjectPage,
  page,
}) => {
  await page.clock.install();
  const { details, notification } = await openDialog(openProjectPage);
  await details.commentsBtn.click();
  await details.comment.fill("Looks wrong on the footer");

  await details.commentSaveBtn.click();
  await expect(notification.message).toHaveText("Comment updated");

  await page.clock.runFor(1500);
  await expect(notification.message).toBeVisible();
  await page.clock.runFor(1000);
  await expect(notification.message).toBeHidden();
});

test("keeps what was typed when the box is opened again", async ({
  openProjectPage,
}) => {
  const { details } = await openDialog(openProjectPage);
  await details.commentsBtn.click();
  await details.comment.fill("A draft");

  await details.commentsBtn.click();
  await expect(details.comment).toBeHidden();
  await details.commentsBtn.click();

  await expect(details.comment).toHaveValue("A draft");
});

test("saves an empty comment to take the comment away", async ({
  openProjectPage,
  page,
}) => {
  const { details } = await openDialog(openProjectPage);
  await details.commentsBtn.click();

  await details.comment.fill("");
  const [request] = await Promise.all([
    page.waitForRequest(commentUpdates),
    details.commentSaveBtn.click(),
  ]);

  expect(request.postDataJSON()).toEqual({ comment: "" });
});

test("closes only the box on Escape and keeps what was typed", async ({
  openProjectPage,
  page,
}) => {
  const { details } = await openDialog(openProjectPage);
  await details.commentsBtn.click();
  await details.comment.fill("A draft");

  await details.commentSaveBtn.focus();
  await page.keyboard.press("Escape");

  await expect(details.comment).toBeHidden();
  await expect(details.step).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`testId=${testRun.id}$`));
  await details.commentsBtn.click();
  await expect(details.comment).toHaveValue("A draft");
});

test("sends nothing when the box is closed without saving", async ({
  openProjectPage,
  page,
}) => {
  const updates: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH") {
      updates.push(request.url());
    }
  });
  const { details } = await openDialog(openProjectPage);
  await details.commentsBtn.click();
  await details.comment.fill("Never saved");

  await details.commentsBtn.click();

  await expect(details.comment).toBeHidden();
  expect(updates).toEqual([]);
});

test("keeps the box open and says so when saving fails", async ({
  openProjectPage,
  page,
}) => {
  await mockApiError(
    page,
    `${API_URL}/test-runs/update/${testRun.id}`,
    500,
    "Could not save",
  );
  const { details, notification } = await openDialog(openProjectPage);
  await details.commentsBtn.click();

  await details.comment.fill("Will not stick");
  await details.commentSaveBtn.click();

  await expect(notification.message).toHaveText("Could not save");
  // two frames on, a box on its way out already has opacity 0
  await afterTwoFrames(page);
  await expect(details.commentBox).toHaveAttribute("style", /opacity: 1/);
  await expect(details.commentSaveBtn).toBeVisible();
  await expect(details.comment).toHaveValue("Will not stick");
});
