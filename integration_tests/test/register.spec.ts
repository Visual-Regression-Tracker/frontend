import { test } from "fixtures";
import { expect } from "@playwright/test";

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
