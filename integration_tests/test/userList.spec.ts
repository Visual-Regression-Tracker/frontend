import { expect } from "@playwright/test";
import { AUTH_USER, test } from "fixtures";
import { UserListPage } from "pages/UserListPage";
import {
  API_URL,
  mockDeleteUsers,
  mockGetProjects,
  mockGetUsers,
} from "utils/mocks";
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
test("renders", async ({ userListPage, page }) => {
  await expect(page).toHaveScreenshot("user-list-page.png");
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

test("deletes the selected users", async ({ userListPage, page }) => {
  await mockDeleteUsers(page);

  await userListPage.table.checkRow(EDITOR_USER.id);
  await userListPage.table.checkRow(GUEST_USER.id);
  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/users` && request.method() === "DELETE",
    ),
    userListPage.deleteSelectedBtn.click(),
  ]);

  expect(request.postDataJSON()).toEqual([EDITOR_USER.id, GUEST_USER.id]);
  await expect(userListPage.notification.message).toHaveText("Removed");
  await expect(userListPage.table.getRow(EDITOR_USER.id)).toHaveCount(0);
  await expect(userListPage.table.getRow(GUEST_USER.id)).toHaveCount(0);
  await expect(userListPage.table.getRow(TEST_USER.id)).toBeVisible();
});

test("renders the selected users", async ({ userListPage, page }) => {
  await userListPage.table.checkRow(EDITOR_USER.id);
  await userListPage.table.checkRow(GUEST_USER.id);
  await expect(userListPage.deleteSelectedBtn).toBeEnabled();

  await expect(page).toHaveScreenshot("user-list-selection.png");
});

test("offers no delete until a user is selected", async ({ userListPage }) => {
  await expect(userListPage.table.getRow(TEST_USER.id)).toBeVisible();

  await expect(userListPage.deleteSelectedBtn).toBeDisabled();
});

test("does not let the signed-in user delete themself", async ({
  page,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authUser,
}) => {
  const self = { ...TEST_USER, ...AUTH_USER, token: undefined };
  await mockGetUsers(page, [self as unknown as User, EDITOR_USER]);
  const deletes: string[] = [];
  page.on("request", (request) => {
    if (request.url() === `${API_URL}/users` && request.method() === "DELETE") {
      deletes.push(request.url());
    }
  });
  await page.goto("/users");
  const userListPage = new UserListPage(page);

  await userListPage.table.checkRow(self.id);
  await userListPage.table.checkRow(EDITOR_USER.id);
  await userListPage.deleteSelectedBtn.click();

  await expect(userListPage.notification.message).toHaveText(
    "You cannot delete yourself.",
  );
  await expect(userListPage.table.getRow(EDITOR_USER.id)).toBeVisible();
  expect(deletes).toEqual([]);
});
