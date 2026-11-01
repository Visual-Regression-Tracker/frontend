import { expect, Page } from "@playwright/test";

// routes load lazily: before the heading renders a screenshot shows an empty page
export const waitForPage = async (page: Page) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");
};
