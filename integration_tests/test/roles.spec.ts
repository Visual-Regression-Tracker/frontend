import { expect } from "@playwright/test";
import { test } from "fixtures";
import { ProjectListPage } from "pages";
import { UserListPage } from "pages/UserListPage";
import { TEST_PROJECT, TEST_USER } from "~client/_test/test.data.helper";
import { mockGetProjects, mockGetUsers } from "utils/mocks";

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [TEST_PROJECT]);
  await mockGetUsers(page, [TEST_USER]);
});

test.describe("as admin", () => {
  test("reaches the user list from the header", async ({
    projectListPage,
    page,
  }) => {
    await projectListPage.header.openAvatarMenu();
    await projectListPage.header.avatarMenuItem("Users").click();

    await expect(page).toHaveURL(/\/users$/);
    await expect(
      new UserListPage(page).table.getRow(TEST_USER.id),
    ).toBeVisible();
  });
});

for (const role of ["editor", "guest"] as const) {
  test.describe(`as ${role}`, () => {
    test.use({ userRole: role });

    test("is sent from the user list to the projects", async ({
      page,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      authUser,
    }) => {
      const userListRequests: string[] = [];
      page.on("request", (request) => {
        if (request.url().endsWith("/users/all")) {
          userListRequests.push(request.url());
        }
      });

      await page.goto("/users");

      await expect(page).toHaveURL(/\/projects$/);
      await expect(new ProjectListPage(page).projects).toBeVisible();
      // the redirect happens before the page mounts, so nothing asked for users
      expect(userListRequests).toEqual([]);
    });

    test("has no users item in the header menu", async ({
      projectListPage,
    }) => {
      await projectListPage.header.openAvatarMenu();

      await expect(
        projectListPage.header.avatarMenuItem("Projects"),
      ).toBeVisible();
      await expect(
        projectListPage.header.avatarMenuItem("Profile"),
      ).toBeVisible();
      await expect(projectListPage.header.avatarMenuItem("Users")).toHaveCount(
        0,
      );
    });
  });
}

// the API lets admins and editors create, update and delete projects
for (const role of ["admin", "editor"] as const) {
  test.describe(`as ${role}`, () => {
    test.use({ userRole: role });

    test("can add, edit and delete projects", async ({ projectListPage }) => {
      await expect(projectListPage.project(TEST_PROJECT.name)).toBeVisible();
      await expect(projectListPage.addBtn).toBeVisible();
      await expect(projectListPage.editBtn).toBeVisible();
      await expect(projectListPage.deleteBtn).toBeVisible();
    });
  });
}

test.describe("as guest", () => {
  test.use({ userRole: "guest" });

  test("sees the projects read-only", async ({ projectListPage }) => {
    await expect(projectListPage.project(TEST_PROJECT.name)).toBeVisible();
    await expect(projectListPage.addBtn).toHaveCount(0);
    await expect(projectListPage.editBtn).toHaveCount(0);
    await expect(projectListPage.deleteBtn).toHaveCount(0);
  });
});
