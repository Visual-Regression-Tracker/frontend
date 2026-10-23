import { test } from "fixtures";
import { expect } from "@playwright/test";
import { API_URL, mockApiError } from "utils/mocks";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test("renders", async ({ registerPage, page }) => {
  await expect(page).toHaveScreenshot("register-page.png");
});

test("can register", async ({ registerPage }) => {
  await registerPage.firstName.type("firstName");
  await registerPage.lastName.type("lastName");
  await registerPage.email.type("email@google.com");
  await registerPage.password.type("123456");

  const [request] = await Promise.all([
    registerPage.page.waitForRequest("**/register"),
    registerPage.registerBtn.click(),
  ]);

  expect(request.postDataJSON()).toEqual({
    firstName: "firstName",
    lastName: "lastName",
    email: "email@google.com",
    password: "123456",
  });
});

test("does not register with invalid details", async ({ registerPage }) => {
  const registrations: string[] = [];
  registerPage.page.on("request", (request) => {
    if (request.url().endsWith("/register")) {
      registrations.push(request.url());
    }
  });

  await registerPage.firstName.fill("f");
  await registerPage.lastName.fill("l");
  await registerPage.email.fill("not an email");
  await registerPage.password.fill("1");
  await registerPage.registerBtn.click();

  // first name, last name and password
  await expect(
    registerPage.page.getByText("Enter at least two characters."),
  ).toHaveCount(3);
  await expect(
    registerPage.page.getByText("Enter a valid email."),
  ).toBeVisible();
  expect(registrations).toEqual([]);
});

test("shows why the API refused the registration", async ({ registerPage }) => {
  await mockApiError(
    registerPage.page,
    `${API_URL}/users/register`,
    400,
    "User already exists",
  );

  await registerPage.firstName.fill("firstName");
  await registerPage.lastName.fill("lastName");
  await registerPage.email.fill("email@google.com");
  await registerPage.password.fill("123456");
  await registerPage.registerBtn.click();

  await expect(registerPage.notification.message).toHaveText(
    "User already exists",
  );
  await expect(registerPage.page).toHaveURL(/\/register$/);
});
