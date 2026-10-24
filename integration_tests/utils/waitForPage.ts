import { expect, Page } from "@playwright/test";

// Routes load lazily: until the page's heading is in, a screenshot catches the
// header over an empty page, and an update run writes that as the baseline.
// The network settling lets list thumbnails and fonts arrive as well.
export const waitForPage = async (page: Page) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");
};
