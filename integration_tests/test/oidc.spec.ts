import { expect } from "@playwright/test";
import { AUTH_USER, test } from "fixtures";
import { LoginPage, ProfilePage } from "pages";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import {
  API_URL,
  mockApiError,
  mockEnvConfig,
  mockGetMe,
  mockGetProjects,
  mockOidcEnabled,
  mockOidcProvider,
} from "utils/mocks";

const PROVIDER_URL = `${API_URL}/users/oidc/login`;

// /users/me answers without the token; the app adds the one it was sent
const ssoUser = { ...AUTH_USER, token: undefined };

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [TEST_PROJECT]);
  await mockOidcProvider(page);
});

test.describe("with SSO off", () => {
  test("shows the password form when the API cannot say", async ({ page }) => {
    // an older backend without the endpoint
    await mockApiError(page, `${API_URL}/users/oidc/enabled`, 404, "Not Found");

    await page.goto("/login");
    const loginPage = new LoginPage(page);

    await expect(loginPage.email).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
    await expect(loginPage.ssoBtn).toHaveCount(0);
  });
});

test.describe("with SSO on", () => {
  test.beforeEach(async ({ page }) => {
    await mockOidcEnabled(page, true);
  });

  test("renders the SSO login", async ({ page }) => {
    await page.goto("/login");
    await expect(new LoginPage(page).ssoBtn).toBeVisible();

    await expect(page).toHaveScreenshot("login-page-sso.png");
  });

  test("renders the profile of an SSO user", async ({ profilePage, page }) => {
    await expect(profilePage.email).toBeDisabled();

    await expect(page).toHaveScreenshot("profile-page-sso.png");
  });

  test("offers SSO instead of the password form", async ({ page }) => {
    await page.goto("/login");
    const loginPage = new LoginPage(page);

    await expect(loginPage.ssoBtn).toBeVisible();
    await expect(loginPage.email).toHaveCount(0);
    await expect(loginPage.password).toHaveCount(0);
    await expect(loginPage.registerLink).toHaveCount(0);
  });

  test("sends the user to the identity provider", async ({ page }) => {
    await page.goto("/login");

    await new LoginPage(page).ssoBtn.click();

    await expect(page).toHaveURL(PROVIDER_URL);
  });

  test("signs in with the token the provider sends back", async ({ page }) => {
    await mockGetMe(page, ssoUser);

    const [request] = await Promise.all([
      page.waitForRequest(`${API_URL}/users/me`),
      page.goto("/login#token=sso-token"),
    ]);

    expect(request.headers()["authorization"]).toBe("Bearer sso-token");
    await expect(page).toHaveURL(/\/projects$/);
    const stored = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("user") ?? "null"),
    );
    expect(stored).toMatchObject({ email: ssoUser.email, token: "sso-token" });
    await expect(new ProfilePage(page).header.avatarButton).toBeVisible();
  });

  test("reports a login the provider refused", async ({ page }) => {
    await page.goto("/login#error=access_denied");
    const loginPage = new LoginPage(page);

    await expect(loginPage.notification.message).toHaveText(
      "SSO login failed.",
    );
    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.ssoBtn).toBeVisible();
  });

  test("reports a token the API does not accept", async ({ page }) => {
    await mockApiError(page, `${API_URL}/users/me`, 401, "Unauthorized");

    await page.goto("/login#token=expired-token");
    const loginPage = new LoginPage(page);

    await expect(loginPage.notification.message).toHaveText("Unauthorized");
    await expect(page).toHaveURL(/\/login$/);
    expect(
      await page.evaluate(() => window.localStorage.getItem("user")),
    ).toBeNull();
  });

  test("sends registration to the login page", async ({ page }) => {
    await page.goto("/register");

    await expect(page).toHaveURL(/\/login$/);
    await expect(new LoginPage(page).ssoBtn).toBeVisible();
  });

  test("leaves the email and password of an SSO user to the provider", async ({
    profilePage,
  }) => {
    await expect(profilePage.email).toBeDisabled();
    await expect(profilePage.passwordForm).toHaveCount(0);
    await expect(profilePage.firstName).toBeEnabled();
  });
});

test.describe("with SSO on and auto redirect", () => {
  test.beforeEach(async ({ page }) => {
    await mockOidcEnabled(page, true);
    await mockEnvConfig(page, { REACT_APP_OIDC_AUTO_REDIRECT: "true" });
  });

  test("goes straight to the identity provider", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(PROVIDER_URL);
  });

  test("does not bounce back to the provider with its answer", async ({
    page,
  }) => {
    await page.goto("/login#error=access_denied");
    const loginPage = new LoginPage(page);

    await expect(loginPage.notification.message).toHaveText(
      "SSO login failed.",
    );
    await expect(page).toHaveURL(/\/login$/);
  });

  test("stays on the login page after logging out", async ({
    projectListPage,
    page,
  }) => {
    const providerRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url() === PROVIDER_URL) {
        providerRequests.push(request.url());
      }
    });

    await projectListPage.header.logout();

    const loginPage = new LoginPage(page);
    await expect(loginPage.ssoBtn).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    // the provider's session would sign the user straight back in
    expect(providerRequests).toEqual([]);

    await loginPage.ssoBtn.click();
    await expect(page).toHaveURL(PROVIDER_URL);
  });
});
