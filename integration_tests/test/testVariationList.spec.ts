import { expect } from "@playwright/test";
import { test } from "fixtures";
import { mockGetProjects, mockGetTestVariations, mockImage } from "utils/mocks";
import {
  TEST_PROJECT,
  TEST_VARIATION_ONE,
  TEST_VARIATION_TWO,
} from "~client/_test/test.data.helper";

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [TEST_PROJECT]);
  await mockGetTestVariations(page, TEST_PROJECT.id, [
    TEST_VARIATION_ONE,
    TEST_VARIATION_TWO,
  ]);
  await mockImage(page, "baseline1.png");
  await mockImage(page, "baseline2.png");
});

test("renders", async ({ openTestVariationListPage, page }) => {
  await openTestVariationListPage(TEST_PROJECT.id);

  await expect(page).toHaveScreenshot("test-variation-list-page.png");
});
