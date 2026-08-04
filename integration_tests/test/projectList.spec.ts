import { expect } from "@playwright/test";
import { test } from "fixtures";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import { mockDeleteProject, mockGetProjects } from "utils/mocks";

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test("renders", async ({ projectListPage, page }) => {
  await expect(page).toHaveScreenshot("projects-list-page.png");
});

test("can delete project", async ({ projectListPage, page }) => {
  await mockDeleteProject(page, project);

  await projectListPage.deleteBtn.click();
  await projectListPage.modal.confirmBtn.click();

  await expect(projectListPage.notification.message).toHaveText(
    "Project name deleted",
  );
});

test("can dismiss a notification without waiting it out", async ({
  projectListPage,
  page,
}) => {
  await mockDeleteProject(page, project);

  await projectListPage.deleteBtn.click();
  await projectListPage.modal.confirmBtn.click();
  await expect(projectListPage.notification.message).toBeVisible();

  await projectListPage.notification.dismissBtn.click();

  // shorter than autoHideDuration, so waiting the toast out cannot pass this
  await expect(projectListPage.notification.message).toBeHidden({
    timeout: 1000,
  });
});

// TEST_PROJECT leaves bulkApproveVariations off, and the axis it names drives
// the grid's grouping either way, so it has to stay visible and changeable
test("offers the group by axis with bulk approve off", async ({
  projectListPage,
  page,
}) => {
  await projectListPage.editBtn.click();

  await expect(page.getByLabel("Group variations by")).toBeVisible();
});
