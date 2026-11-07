import { expect, type Page } from "@playwright/test";
import { AUTH_USER, test } from "fixtures";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import {
  API_URL,
  mockApiError,
  mockChangePassword,
  mockGetProjects,
  mockNewApiKey,
  mockOidcEnabled,
  mockUpdateUser,
} from "utils/mocks";
import { waitForPage } from "utils/waitForPage";

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test("renders", async ({ profilePage, page }) => {
  await waitForPage(page);
  await expect(page).toHaveScreenshot("profile-page.png");
});

test("updates the user details", async ({ profilePage, page }) => {
  await mockUpdateUser(page, AUTH_USER);

  await profilePage.firstName.fill("Jane");
  await profilePage.lastName.fill("Doe");
  await profilePage.email.fill("jane@example.com");

  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/users` && request.method() === "PUT",
    ),
    profilePage.updateUserBtn.click(),
  ]);

  expect(request.postDataJSON()).toEqual({
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
  });
  await expect(profilePage.notification.message).toHaveText("User updated");
  await expect(profilePage.header.avatarButton).toHaveText("JD");
  const stored = await page.evaluate((): unknown =>
    JSON.parse(window.localStorage.getItem("user") ?? "{}"),
  );
  expect(stored).toMatchObject({ firstName: "Jane", lastName: "Doe" });
});

test("does not send user details that fail validation", async ({
  profilePage,
  page,
}) => {
  const updates: string[] = [];
  page.on("request", (request) => {
    if (request.url() === `${API_URL}/users` && request.method() === "PUT") {
      updates.push(request.url());
    }
  });

  await profilePage.firstName.fill("J");
  await profilePage.email.fill("not an email");
  await profilePage.updateUserBtn.click();

  await expect(
    profilePage.userForm.getByText("Enter at least two characters."),
  ).toBeVisible();
  await expect(
    profilePage.userForm.getByText("Enter a valid email."),
  ).toBeVisible();
  expect(updates).toEqual([]);
});

test("changes the password", async ({ profilePage, page }) => {
  await mockChangePassword(page);

  await profilePage.password.fill("new password");

  const [request] = await Promise.all([
    page.waitForRequest("**/users/password"),
    profilePage.updatePasswordBtn.click(),
  ]);

  expect(request.postDataJSON()).toEqual({ password: "new password" });
  await expect(profilePage.notification.message).toHaveText("Password updated");
  await expect(profilePage.password).toHaveValue("");
});

test("shows the crumb Profile and no subtitle", async ({
  profilePage,
  page,
}) => {
  await expect(profilePage.header.breadcrumb).toHaveText("Profile");
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(page.getByText("the key your test runs use")).toHaveCount(0);
});

test("shows the role as a chip with who changes it", async ({
  profilePage,
}) => {
  await expect(profilePage.role).toHaveText("Admin");
  await expect(
    profilePage.userForm.getByText("changed by an admin on Users"),
  ).toBeVisible();
});

test("puts first and last name in one row and Update at the right", async ({
  profilePage,
}) => {
  const first = await profilePage.firstName.boundingBox();
  const last = await profilePage.lastName.boundingBox();
  const card = await profilePage.userForm.boundingBox();
  const update = await profilePage.updateUserBtn.boundingBox();

  expect(first?.y).toBe(last?.y);
  expect((last?.x ?? 0) > (first?.x ?? 0)).toBe(true);
  expect(
    (update?.x ?? 0) + (update?.width ?? 0) >
      (card?.x ?? 0) + (card?.width ?? 0) - 40,
  ).toBe(true);
});

test("shows the API key and puts it in the config examples", async ({
  profilePage,
}) => {
  await expect(profilePage.apiKey).toHaveValue(AUTH_USER.apiKey);
  await expect(profilePage.configFile).toHaveValue(
    new RegExp(`"apiKey": "${AUTH_USER.apiKey}"`),
  );

  await profilePage.envVariablesBtn.click();

  await expect(profilePage.envVariables).toHaveValue(
    new RegExp(`VRT_APIKEY="${AUTH_USER.apiKey}"`),
  );
});

test.describe("copying", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  const clipboard = (page: Page) =>
    page.evaluate(() => navigator.clipboard.readText());

  test("copies the API key", async ({ profilePage, page }) => {
    await profilePage.copyApiKeyBtn.click();

    await expect(profilePage.notification.message).toHaveText("API key copied");
    expect(await clipboard(page)).toBe(AUTH_USER.apiKey);
  });

  test("copies the shown configuration", async ({ profilePage, page }) => {
    await profilePage.envVariablesBtn.click();
    await profilePage.copyExamplesBtn.click();

    await expect(profilePage.notification.message).toHaveText(
      "Configuration copied",
    );
    expect(await clipboard(page)).toContain(`VRT_APIKEY="${AUTH_USER.apiKey}"`);
  });
});

test("regenerates the API key after confirmation", async ({
  profilePage,
  page,
}) => {
  await mockNewApiKey(page, "BRAND-NEW-KEY");

  await profilePage.regenerateBtn.click();
  await expect(profilePage.modal.dialog).toContainText("CI jobs");
  await profilePage.modal.confirmBtn.click();

  await expect(profilePage.notification.message).toHaveText(
    "API key regenerated",
  );
  await expect(profilePage.apiKey).toHaveValue("BRAND-NEW-KEY");
  await expect(profilePage.configFile).toHaveValue(/"apiKey": "BRAND-NEW-KEY"/);
  const stored = await page.evaluate((): unknown =>
    JSON.parse(window.localStorage.getItem("user") ?? "{}"),
  );
  expect(stored).toMatchObject({ apiKey: "BRAND-NEW-KEY" });
});

test("keeps the API key when regenerating is cancelled", async ({
  profilePage,
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/users/newApiKey")) {
      requests.push(request.url());
    }
  });

  await profilePage.regenerateBtn.click();
  await profilePage.modal.cancelBtn.click();

  await expect(profilePage.modal.dialog).toHaveCount(0);
  await expect(profilePage.apiKey).toHaveValue(AUTH_USER.apiKey);
  expect(requests).toEqual([]);
});

test.describe("with SSO", () => {
  test.beforeEach(async ({ page }) => {
    await mockOidcEnabled(page, true);
  });

  test("locks the email with a hint and hides the password card", async ({
    profilePage,
  }) => {
    await expect(profilePage.email).toBeDisabled();
    await expect(
      profilePage.userForm.getByText("Locked when you sign in with SSO"),
    ).toBeVisible();
    await expect(profilePage.passwordForm).toHaveCount(0);
  });
});

test("says why regenerating the API key failed and keeps the key", async ({
  profilePage,
  page,
}) => {
  await mockApiError(page, "**/users/newApiKey", 500, "Could not regenerate");

  await profilePage.regenerateBtn.click();
  await profilePage.modal.confirmBtn.click();

  await expect(profilePage.notification.message).toHaveText(
    "Could not regenerate",
  );
  await expect(profilePage.apiKey).toHaveValue(AUTH_USER.apiKey);
});
