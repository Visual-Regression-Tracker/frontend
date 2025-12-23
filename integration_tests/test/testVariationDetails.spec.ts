import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  mockGetProjects,
  mockGetTestVariationDetails,
  mockImage,
} from "utils/mocks";
import {
  TEST_PROJECT,
  TEST_VARIATION_ONE,
} from "~client/_test/test.data.helper";

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [TEST_PROJECT]);
  await mockGetTestVariationDetails(page, TEST_VARIATION_ONE);
  await mockImage(page, "baseline1.png");
  await mockImage(page, "baseline2.png");
});

test("renders", async ({ openTestVariationDetailsPage, page }) => {
  await openTestVariationDetailsPage(TEST_VARIATION_ONE.id);

  await expect(page).toHaveScreenshot("test-variation-details-page.png", {
    fullPage: true,
  });
});
