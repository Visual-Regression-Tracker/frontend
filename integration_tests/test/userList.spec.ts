import { expect } from "@playwright/test";
import { test } from "fixtures";
import { mockGetProjects, mockGetUsers } from "utils/mocks";
import {
  EDITOR_USER,
  GUEST_USER,
  TEST_PROJECT,
  TEST_USER,
} from "~client/_test/test.data.helper";
import { Role, User } from "~client/types";

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [TEST_PROJECT]);
  await mockGetUsers(page, [TEST_USER, EDITOR_USER, GUEST_USER]);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test("renders", async ({ userListPage, page, vrt }) => {
  await vrt.trackPage(page, "User list page");
});

const assignRoleCases: [User, keyof typeof Role][] = [
  [EDITOR_USER, "admin"],
  [EDITOR_USER, "guest"],
  [GUEST_USER, "editor"],
];

for (const [user, role] of assignRoleCases) {
  test(`can assign role ${role}`, async ({ userListPage, page }) => {
    const [request] = await Promise.all([
      page.waitForRequest("**/assignRole"),
      userListPage.changeRole(user.id, role),
    ]);

    expect(request.postDataJSON()).toEqual({
      id: user.id,
      role,
    });
  });
}
