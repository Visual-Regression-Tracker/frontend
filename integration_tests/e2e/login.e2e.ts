import { expect } from "@playwright/test";
import { LoginPage } from "pages";
import { ADMIN, test } from "./fixtures";

test("the seeded admin logs in and sees the projects", async ({ page }) => {
  await page.goto("/");
  const loginPage = new LoginPage(page);

  await loginPage.email.fill(ADMIN.email);
  await loginPage.password.fill(ADMIN.password);
  await loginPage.loginBtn.click();

  await expect(page).toHaveURL(/\/projects$/);
  await expect(loginPage.header.avatarButton).toBeVisible();
});
