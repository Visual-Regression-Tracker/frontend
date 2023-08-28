import { test } from "fixtures";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import { mockGetProjects } from "utils/mocks";

// Run tests in this file with dark mode preferred
test.use({ colorScheme: "dark" });

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
});

test("dark mode login", async ({ page, vrt }) => {
  await page.goto("/login");
  await vrt.trackPage(page, "Login page - Dark mode");
});

test("dark mode projects", async ({ page, vrt }) => {
  await page.goto("/projects");
  await vrt.trackPage(page, "Projects list page - Dark mode");
});

test("dark mode profile", async ({ page, vrt }) => {
  await page.goto("/profile");
  await vrt.trackPage(page, "User profile page - Dark mode");
});

test("dark mode register", async ({ page, vrt }) => {
  await page.goto("/register");
  await vrt.trackPage(page, "Register page - Dark mode");
});

test("dark mode users", async ({ page, vrt }) => {
  await page.goto("/users");
  await vrt.trackPage(page, "User list page - Dark mode");
});
