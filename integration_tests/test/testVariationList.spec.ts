import { expect } from "@playwright/test";
import { test } from "fixtures";
import {
  mockDeleteTestVariation,
  mockGetProjects,
  mockGetTestVariations,
  mockImage,
} from "utils/mocks";
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

  await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
  await expect(page.getByText("2 baselines")).toBeVisible();
  await expect(page).toHaveScreenshot("test-variation-list-page.png");
});

test("deletes a variation", async ({ openTestVariationListPage, page }) => {
  await mockDeleteTestVariation(page, TEST_VARIATION_TWO);
  const listPage = await openTestVariationListPage(TEST_PROJECT.id);

  await listPage.deleteBtn(TEST_VARIATION_TWO.name).click();
  await expect(listPage.modal.dialog).toContainText(
    `Are you sure you want to delete: ${TEST_VARIATION_TWO.name}?`,
  );
  await Promise.all([
    page.waitForRequest(
      (request) =>
        request.method() === "DELETE" &&
        decodeURIComponent(new URL(request.url()).pathname) ===
          `/test-variations/${TEST_VARIATION_TWO.id}`,
    ),
    listPage.modal.confirmBtn.click(),
  ]);

  await expect(listPage.notification.message).toHaveText(
    `${TEST_VARIATION_TWO.name} deleted`,
  );
  await expect(listPage.getCard(TEST_VARIATION_TWO.name)).toHaveCount(0);
  await expect(listPage.getCard(TEST_VARIATION_ONE.name)).toBeVisible();
});

test("keeps a variation when the delete is cancelled", async ({
  openTestVariationListPage,
}) => {
  const listPage = await openTestVariationListPage(TEST_PROJECT.id);

  await listPage.deleteBtn(TEST_VARIATION_TWO.name).click();
  await listPage.modal.cancelBtn.click();

  await expect(listPage.modal.dialog).toBeHidden();
  await expect(listPage.getCard(TEST_VARIATION_TWO.name)).toBeVisible();
});

test("narrows the list with the filters and brings it back with Clear filters", async ({
  openTestVariationListPage,
  page,
}) => {
  await mockGetTestVariations(page, TEST_PROJECT.id, [
    TEST_VARIATION_ONE,
    { ...TEST_VARIATION_TWO, branchName: "develop" },
  ]);
  const listPage = await openTestVariationListPage(TEST_PROJECT.id);

  await listPage.filterBy("branchName", "develop");

  await expect(listPage.getCard(TEST_VARIATION_ONE.name)).toHaveCount(0);
  await expect(listPage.getCard(TEST_VARIATION_TWO.name)).toBeVisible();

  await listPage.clearFilters.click();

  await expect(listPage.getCard(TEST_VARIATION_ONE.name)).toBeVisible();
});
