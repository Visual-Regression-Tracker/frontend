import { test } from "fixtures";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import { mockGetProjects } from "utils/mocks";

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
});

test("renders", async ({ profilePage, page, vrt }) => {
  await vrt.trackPage(page, "Profile page");
});
