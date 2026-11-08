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
import { waitForPage } from "utils/waitForPage";

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [TEST_PROJECT]);
  await mockGetUsers(page, [TEST_USER, EDITOR_USER, GUEST_USER]);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test("renders", async ({ userListPage, page }) => {
  await waitForPage(page);
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
    (async () => {
      await userListPage.deleteSelectedBtn.click();
      await userListPage.modal.confirmBtn.click();
    })(),
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
  await expect(userListPage.selectionBar).toContainText("2 selected");

  await expect(page).toHaveScreenshot("user-list-selection.png");
});

test("offers no selection bar until a user is selected", async ({
  userListPage,
}) => {
  await expect(userListPage.table.getRow(TEST_USER.id)).toBeVisible();

  await expect(userListPage.selectionBar).toHaveCount(0);
});

test("changes the role of every selected user", async ({
  userListPage,
  page,
}) => {
  const requests: unknown[] = [];
  await page.route("**/assignRole", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ body: JSON.stringify(EDITOR_USER) });
  });
  await userListPage.table.checkRow(EDITOR_USER.id);
  await userListPage.table.checkRow(GUEST_USER.id);
  await userListPage.changeRoleBtn.click();
  await page.getByRole("menuitem", { name: "Admin" }).click();

  await expect(userListPage.notification.message).toHaveText("Updated");
  expect(requests).toHaveLength(2);
  expect(requests).toContainEqual({ id: GUEST_USER.id, role: "admin" });
  expect(requests).toContainEqual({ id: EDITOR_USER.id, role: "admin" });
});

test("finds people by name or email", async ({ userListPage }) => {
  await userListPage.searchField.fill("editor");

  await expect(userListPage.table.getRow(EDITOR_USER.id)).toBeVisible();
  await expect(userListPage.table.getRow(GUEST_USER.id)).toHaveCount(0);
});

test("shows only Guests from the new guests banner", async ({
  userListPage,
}) => {
  await expect(userListPage.guestBanner).toContainText(
    "1 new person is a Guest.",
  );

  await userListPage.showGuestsBtn.click();

  await expect(userListPage.table.getRow(GUEST_USER.id)).toBeVisible();
  await expect(userListPage.table.getRow(EDITOR_USER.id)).toHaveCount(0);
  await expect(userListPage.roleFilter).toHaveText("Role: 1");
});

test("sorts people by role", async ({ userListPage, page }) => {
  await page.getByRole("columnheader", { name: /^Role/ }).click();

  await expect(userListPage.table.getRow(TEST_USER.id)).toBeVisible();
  const ids = await page
    .locator(".MuiDataGrid-row")
    .evaluateAll((rows) => rows.map((row) => row.getAttribute("data-id")));
  expect(ids).toEqual([TEST_USER.id, EDITOR_USER.id, GUEST_USER.id]);
});

test("does not let the signed-in user be selected", async ({
  page,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authUser,
}) => {
  const self = { ...TEST_USER, ...AUTH_USER, token: undefined };
  await mockGetUsers(page, [self as unknown as User, EDITOR_USER]);
  await page.goto("/users");
  const userListPage = new UserListPage(page);

  await expect(userListPage.table.getRow(self.id)).toContainText("you");
  await expect(
    userListPage.table.getColumn(self.id, "__check__").getByRole("checkbox"),
  ).toBeDisabled();
});
