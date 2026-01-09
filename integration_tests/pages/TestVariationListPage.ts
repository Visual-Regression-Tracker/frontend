import { BasePage } from "./BasePage";
import { LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_PROJECT } from "~client/constants/help";

export class TestVariationListPage extends BasePage {
  selectProject = this.page.locator(`#${LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_PROJECT}`);
}
