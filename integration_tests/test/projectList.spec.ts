import { expect } from "@playwright/test";
import { test } from "fixtures";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import { mockDeleteProject, mockGetProjects } from "utils/mocks";

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
});

test("renders", async ({ projectListPage, page, vrt }) => {
  await vrt.trackPage(page, "Projects list page");
});

test("can delete project", async ({ projectListPage, page }) => {
  await mockDeleteProject(page, project);

  await projectListPage.deleteBtn.click();
  await projectListPage.modal.confirmBtn.click();

  await expect(projectListPage.notification.message).toHaveText(
    "Project name deleted"
  );
});
