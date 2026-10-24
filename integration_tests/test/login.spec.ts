import { AUTH_USER, test } from "fixtures";
import { expect } from "@playwright/test";
import { LoginPage, ProfilePage } from "pages";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import { API_URL, mockApiError, mockGetProjects, mockLogin } from "utils/mocks";

test("renders", async ({ loginPage }) => {
  await expect(loginPage.page).toHaveScreenshot("login-page.png");
});

test("can login", async ({ loginPage }) => {
  await loginPage.email.type("email@google.com");
  await loginPage.password.type("123456");

  const [request] = await Promise.all([
    loginPage.page.waitForRequest("**/login"),
    loginPage.loginBtn.click(),
  ]);

  expect(request.postDataJSON()).toEqual({
    email: "email@google.com",
    password: "123456",
  });
});

test("show and hide password", async ({ loginPage }) => {
  await loginPage.password.type("123456");

  await loginPage.showPasswordBtn.click();
  expect(await loginPage.password.getAttribute("type")).toBe("text");

  await loginPage.showPasswordBtn.click();
  expect(await loginPage.password.getAttribute("type")).toBe("password");
});

test("shows why the login was refused", async ({ loginPage, page }) => {
  await mockApiError(
    page,
    `${API_URL}/users/login`,
    401,
    "Invalid email or password",
  );

  await loginPage.email.fill("email@google.com");
  await loginPage.password.fill("wrong password");
  await loginPage.loginBtn.click();

  await expect(loginPage.notification.message).toHaveText(
    "Invalid email or password",
  );
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginPage.loginForm).toBeVisible();
});

test("does not send an email that is not one", async ({ loginPage, page }) => {
  const logins: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/users/login")) {
      logins.push(request.url());
    }
  });

  await loginPage.email.fill("not an email");
  await loginPage.password.fill("123456");
  await loginPage.loginBtn.click();

  await expect(page.getByText("Enter a valid email.")).toBeVisible();
  expect(logins).toEqual([]);
});

test("returns to the page that asked for the login", async ({ page }) => {
  await mockGetProjects(page, [TEST_PROJECT]);
  await mockLogin(page, AUTH_USER);

  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
  const loginPage = new LoginPage(page);
  await loginPage.email.fill(AUTH_USER.email);
  await loginPage.password.fill("123456");
  await loginPage.loginBtn.click();

  await expect(page).toHaveURL(/\/profile$/);
  await expect(new ProfilePage(page).firstName).toHaveValue(
    AUTH_USER.firstName,
  );
});

test("goes to the projects after a plain login", async ({
  loginPage,
  page,
}) => {
  await mockGetProjects(page, [TEST_PROJECT]);
  await mockLogin(page, AUTH_USER);

  await loginPage.email.fill(AUTH_USER.email);
  await loginPage.password.fill("123456");
  await loginPage.loginBtn.click();

  await expect(page).toHaveURL(/\/projects$/);
  await expect(loginPage.header.avatarButton).toBeVisible();
});
