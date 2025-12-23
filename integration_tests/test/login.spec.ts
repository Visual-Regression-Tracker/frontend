import { test } from "fixtures";
import { expect } from "@playwright/test";

test("renders", async ({ page }) => {
  await expect(page).toHaveScreenshot("login-page.png");
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
