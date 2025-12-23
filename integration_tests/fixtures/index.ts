import { test as base } from "@playwright/test";
import { LoginPage, ProfilePage, ProjectListPage, ProjectPage } from "pages";
import { RegisterPage } from "pages/RegisterPage";
import { TestVariationDetailsPage } from "pages/TestVariationDetailsPage";
import { TestVariationListPage } from "pages/TestVariationListPage";
import { UserListPage } from "pages/UserListPage";

type Fixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  openProjectPage: (
    id: string,
    buildId?: string,
    testId?: string,
  ) => Promise<ProjectPage>;
  openTestVariationListPage: (
    projectId: string,
  ) => Promise<TestVariationListPage>;
  openTestVariationDetailsPage: (
    id: string,
  ) => Promise<TestVariationDetailsPage>;
  projectListPage: ProjectListPage;
  profilePage: ProfilePage;
  userListPage: UserListPage;
  authUser: void;
};

export const test = base.extend<Fixtures>({
  loginPage: [
    async ({ page }, use) => {
      await page.goto("/");

      await use(new LoginPage(page));
    },
    { auto: true },
  ],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  projectListPage: async ({ page, authUser }, use) => {
    await page.goto("/projects");

    await use(new ProjectListPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  profilePage: async ({ page, authUser }, use) => {
    await page.goto("/profile");

    await use(new ProfilePage(page));
  },
  registerPage: async ({ page }, use) => {
    await page.goto("/register");

    await use(new RegisterPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userListPage: async ({ page, authUser }, use) => {
    await page.goto("/users");

    await use(new UserListPage(page));
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  openProjectPage: async ({ page, authUser }, use) => {
    await use(async (id, buildId, testId) => {
      let url = `${id}`;
      if (buildId) {
        url = url.concat(`?buildId=${buildId}`);
        if (testId) {
          url = url.concat(`&testId=${testId}`);
        }
      }
      await page.goto(url);
      return new ProjectPage(page);
    });
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  openTestVariationListPage: async ({ page, authUser }, use) => {
    await use(async (projectId) => {
      await page.goto(`/variations/${projectId}`);
      return new TestVariationListPage(page);
    });
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  openTestVariationDetailsPage: async ({ page, authUser }, use) => {
    await use(async (id) => {
      await page.goto(`/variations/details/${id}`);
      return new TestVariationDetailsPage(page);
    });
  },
  authUser: async ({ page }, use) => {
    await page.evaluate(() =>
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          id: "00b428bf-9b4d-487f-9883-0dc5ec9403d3",
          email: "visual-regression-tracker@example.com",
          firstName: "fname",
          lastName: "lname",
          apiKey: "ASJDHGAKJSDGASD",
          role: "admin",
          token: "eyJsgOE8Bw2bFwhZAugRRGm8U",
        }),
      ),
    );

    await use();
  },
});
