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

test("renders", async ({ openTestVariationDetailsPage, page, vrt }) => {
  const testVariationDetailsPage = await openTestVariationDetailsPage(
    TEST_VARIATION_ONE.id
  );

  await vrt.trackPage(page, "TestVariationDetails page", {
    screenshotOptions: { fullPage: true },
  });
});
