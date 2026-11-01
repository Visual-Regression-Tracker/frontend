import { test } from "fixtures";
import { expect } from "@playwright/test";
import { LoginPage } from "pages";
import { RegisterPage } from "pages/RegisterPage";
import { API_URL, mockApiError, mockRegistrationEnabled } from "utils/mocks";
import { waitForPage } from "utils/waitForPage";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test("renders", async ({ registerPage, page }) => {
  await waitForPage(page);
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

test("explains that registration is off instead of showing the form", async ({
  page,
}) => {
  await mockRegistrationEnabled(page, false);

  await page.goto("/register");
  const registerPage = new RegisterPage(page);

  await expect(
    page.getByText(
      "Registration is turned off. Ask an administrator for an account.",
    ),
  ).toBeVisible();
  await expect(registerPage.registerBtn).toHaveCount(0);
});

test("hides the register link on the login form when registration is off", async ({
  page,
}) => {
  await mockRegistrationEnabled(page, false);

  await page.goto("/login");
  const loginPage = new LoginPage(page);

  await expect(loginPage.loginBtn).toBeVisible();
  await expect(loginPage.registerLink).toHaveCount(0);
});

test("links to registration from the login form when the API cannot say", async ({
  page,
}) => {
  // an older backend without the endpoint
  await mockApiError(
    page,
    `${API_URL}/users/registration/enabled`,
    404,
    "Not Found",
  );

  await page.goto("/login");

  await expect(new LoginPage(page).registerLink).toBeVisible();
});
