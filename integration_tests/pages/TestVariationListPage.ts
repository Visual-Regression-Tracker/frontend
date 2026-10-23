import { BasePage } from "./BasePage";
import {
  LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_PROJECT,
  LOCATOR_TEST_VARIATION_SELECT_BRANCH,
} from "~client/constants/help";

export class TestVariationListPage extends BasePage {
  selectProject = this.page.locator(
    `#${LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_PROJECT}`,
  );
  cards = this.page.locator(".MuiCard-root");

  // TestVariationMergeForm
  mergeForm = this.page.locator("form").filter({
    has: this.page.locator(`#${LOCATOR_TEST_VARIATION_SELECT_BRANCH}`),
  });
  fromBranch = this.mergeForm.getByRole("combobox").first();
  toBranch = this.mergeForm.getByLabel("To branch");
  mergeBtn = this.page.locator(`#${LOCATOR_TEST_VARIATION_SELECT_BRANCH}`);

  // by the image title: one variation's name can be part of another's
  getCard(name: string) {
    return this.cards.filter({
      has: this.page.locator(`img[title="${name}"]`),
    });
  }

  deleteBtn(name: string) {
    return this.getCard(name).getByTestId("DeleteIcon");
  }

  async merge(fromBranch: string, toBranch: string) {
    await this.fromBranch.click();
    await this.page
      .getByRole("option", { name: fromBranch, exact: true })
      .click();
    await this.toBranch.fill(toBranch);
    await this.mergeBtn.click();
  }
}
