import { expect } from "@playwright/test";
import { test } from "~integration_tests/fixtures";
import {
  API_URL,
  getProjectsGetUrl,
  getProjectsDeleteUrl,
} from "~integration_tests/utils/data";
import { TEST_PROJECT } from "~client/_test/test.data.helper";

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await page.route(getProjectsGetUrl(API_URL), (route) =>
    route.fulfill({
      body: JSON.stringify([project]),
    })
  );
});

test("renders", async ({ projectListPage, page, vrt }) => {
  await vrt.trackPage(page, "Projects list page");
});

test("can delete project", async ({ projectListPage, page }) => {
  await page.route(getProjectsDeleteUrl(API_URL, project.id), (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify(project),
    })
  );

  await projectListPage.deleteBtn.click();
  await projectListPage.modal.confirmBtn.click();

  await expect(projectListPage.notification.message).toHaveText(
    "Project name deleted"
  );
});
