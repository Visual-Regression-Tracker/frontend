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
