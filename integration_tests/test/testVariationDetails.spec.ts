import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  API_URL,
  mockApiError,
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

test("lists every baseline with who made it", async ({
  openTestVariationDetailsPage,
}) => {
  const detailsPage = await openTestVariationDetailsPage(TEST_VARIATION_ONE.id);

  await expect(detailsPage.testRunBtns).toHaveCount(
    TEST_VARIATION_ONE.baselines.length,
  );
  const { user } = TEST_VARIATION_ONE.baselines[0];
  await expect(
    detailsPage.page.getByText(
      `${user?.firstName} ${user?.lastName} <${user?.email}>`,
    ),
  ).toHaveCount(TEST_VARIATION_ONE.baselines.length);
});

test("opens the test run a baseline came from", async ({
  openTestVariationDetailsPage,
  page,
}) => {
  const detailsPage = await openTestVariationDetailsPage(TEST_VARIATION_ONE.id);
  const { testRun } = TEST_VARIATION_ONE.baselines[0];

  await detailsPage.testRunBtns.first().click();

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === `/${TEST_VARIATION_ONE.projectId}` &&
      url.searchParams.get("buildId") === testRun?.buildId &&
      url.searchParams.get("testId") === testRun?.id,
  );
});

test("shows why the variation did not load", async ({
  openTestVariationDetailsPage,
  page,
}) => {
  await mockApiError(
    page,
    `${API_URL}/test-variations/details/${TEST_VARIATION_ONE.id}`,
    500,
    "Could not load the variation",
  );

  const detailsPage = await openTestVariationDetailsPage(TEST_VARIATION_ONE.id);

  await expect(detailsPage.notification.message).toHaveText(
    "Could not load the variation",
  );
  await expect(detailsPage.testRunBtns).toHaveCount(0);
});
