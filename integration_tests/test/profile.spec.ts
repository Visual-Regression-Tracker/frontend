import { expect } from "@playwright/test";
import { AUTH_USER, test } from "fixtures";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import {
  API_URL,
  mockChangePassword,
  mockGetProjects,
  mockUpdateUser,
} from "utils/mocks";

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test("renders", async ({ profilePage, page }) => {
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
  // the header shows the saved user, and it is kept for the next visit
  await expect(profilePage.header.avatarButton).toHaveText("JD");
  const stored = await page.evaluate(() =>
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
    profilePage.userForm.getByText("Enter valid email address"),
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

test("shows the API key and puts it in the config examples", async ({
  profilePage,
}) => {
  await expect(profilePage.apiKeyCard).toContainText(AUTH_USER.apiKey);
  await expect(profilePage.configFile).toHaveValue(
    new RegExp(`"apiKey": "${AUTH_USER.apiKey}"`),
  );

  await profilePage.envVariablesTab.click();

  await expect(profilePage.envVariables).toHaveValue(
    new RegExp(`VRT_APIKEY="${AUTH_USER.apiKey}"`),
  );
});
