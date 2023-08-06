import { test as base } from "@playwright/test";
import { PlaywrightVisualRegressionTracker } from "@visual-regression-tracker/agent-playwright";
import { LoginPage, ProfilePage, ProjectListPage, ProjectPage } from "pages";
import { RegisterPage } from "pages/RegisterPage";
import { UserListPage } from "pages/UserListPage";

type Fixtures = {
  vrt: PlaywrightVisualRegressionTracker;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  openProjectPage: (
    id: string,
    buildId?: string,
    testRunId?: string
  ) => Promise<ProjectPage>;
  projectListPage: ProjectListPage;
  profilePage: ProfilePage;
  userListPage: UserListPage;
  authUser: void;
};

export const test = base.extend<Fixtures>({
  vrt: async ({ browserName }, use) => {
    const vrt = new PlaywrightVisualRegressionTracker(browserName);

    await vrt.start();
    await use(vrt);
    await vrt.stop();
  },
  loginPage: [
    async ({ page }, use) => {
      await page.goto("/");

      await use(new LoginPage(page));
    },
    { auto: true },
  ],
  projectListPage: async ({ page, authUser }, use) => {
    await page.goto("/projects");

    await use(new ProjectListPage(page));
  },
  profilePage: async ({ page, authUser }, use) => {
    await page.goto("/profile");

    await use(new ProfilePage(page));
  },
  registerPage: async ({ page }, use) => {
    await page.goto("/register");

    await use(new RegisterPage(page));
  },
  userListPage: async ({ page, authUser }, use) => {
    await page.goto("/users");

    await use(new UserListPage(page));
  },
  openProjectPage: async ({ page, authUser }, use) => {
    await use(async (id, buildId, testRunId) => {
      await page.goto(`${id}`);
      return new ProjectPage(page);
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
        })
      )
    );

    await use();
  },
});
