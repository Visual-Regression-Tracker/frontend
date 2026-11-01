import { expect, Page } from "@playwright/test";
import { test } from "fixtures";
import { ProjectListPage } from "pages";
import { UserListPage } from "pages/UserListPage";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_RUN_NEW,
  TEST_UNRESOLVED,
  TEST_USER,
  TEST_VARIATION_ONE,
  TEST_VARIATION_TWO,
} from "~client/_test/test.data.helper";
import {
  API_URL,
  mockApiError,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestVariations,
  mockGetUsers,
  mockImage,
  mockTestRunsWithDetails,
} from "utils/mocks";

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

const mockReviewData = async (page: Page) => {
  await mockGetBuilds(page, TEST_PROJECT.id, [TEST_BUILD_FAILED]);
  await mockGetBuildDetails(page, TEST_BUILD_FAILED);
  await mockTestRunsWithDetails(page, TEST_BUILD_FAILED.id, [
    TEST_UNRESOLVED,
    TEST_RUN_NEW,
  ]);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");
  await mockGetTestVariations(page, TEST_PROJECT.id, [
    TEST_VARIATION_ONE,
    TEST_VARIATION_TWO,
  ]);
  await mockImage(page, "baseline1.png");
  await mockImage(page, "baseline2.png");
};

// a guest reviews like an editor: the API, not the UI, refuses what a guest may not do
for (const role of ["editor", "guest"] as const) {
  test.describe(`as ${role} reviewing runs`, () => {
    test.use({ userRole: role });

    test.beforeEach(async ({ page }) => {
      await mockReviewData(page);
    });

    test("can approve and reject a run in its details dialog", async ({
      openProjectPage,
    }) => {
      const projectPage = await openProjectPage(
        TEST_PROJECT.id,
        TEST_BUILD_FAILED.id,
        TEST_UNRESOLVED.id,
      );

      await expect(projectPage.details.approve).toBeEnabled();
      await expect(projectPage.details.reject).toBeEnabled();
    });

    test("can approve and reject the selected runs in bulk", async ({
      openProjectPage,
    }) => {
      const projectPage = await openProjectPage(
        TEST_PROJECT.id,
        TEST_BUILD_FAILED.id,
      );
      await projectPage.testRunList.gridViewToggle.click();
      await projectPage.testRunList.checkCard(TEST_UNRESOLVED.name);

      await expect(projectPage.testRunList.bulkApproveBtn).toBeEnabled();
      await expect(projectPage.testRunList.bulkRejectBtn).toBeEnabled();
    });

    test("can delete and merge variations on the variation list", async ({
      openTestVariationListPage,
    }) => {
      const listPage = await openTestVariationListPage(TEST_PROJECT.id);

      await expect(listPage.deleteBtn(TEST_VARIATION_ONE.name)).toBeVisible();
      await expect(listPage.fromBranch).toBeVisible();
      await expect(listPage.toBranch).toBeVisible();
      await expect(listPage.mergeBtn).toBeVisible();
    });
  });
}

test.describe("as guest refused by the API", () => {
  test.use({ userRole: "guest" });

  test.beforeEach(async ({ page }) => {
    await mockReviewData(page);
  });

  test("is told why an approval is refused", async ({
    openProjectPage,
    page,
  }) => {
    await mockApiError(
      page,
      `${API_URL}/test-runs/approve?merge=false`,
      403,
      "Guests cannot approve runs",
    );
    const projectPage = await openProjectPage(
      TEST_PROJECT.id,
      TEST_BUILD_FAILED.id,
      TEST_UNRESOLVED.id,
    );

    await projectPage.details.approve.click();

    const toast = projectPage.notification.toast("Guests cannot approve runs");
    await expect(toast).toBeVisible();
    await expect(toast).toHaveClass(/notistack-MuiContent-error/);
  });
});
