import { test } from "fixtures";
import { mockGetProjects, mockGetUsers } from "utils/mocks";
import {
  EDITOR_USER,
  GUEST_USER,
  TEST_PROJECT,
  TEST_USER,
} from "~client/_test/test.data.helper";

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [TEST_PROJECT]);
  await mockGetUsers(page, [TEST_USER, EDITOR_USER, GUEST_USER]);
});

test.only("renders", async ({ userListPage, page, vrt }) => {
  await vrt.trackPage(page, "User list page");
});
