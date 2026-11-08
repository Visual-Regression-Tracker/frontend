import { BasePage } from "./BasePage";
import { TEST_ID, filterChipId } from "~client/constants/locators";

export class TestVariationListPage extends BasePage {
  cards = this.page.locator(".MuiCard-root");
  nameFilter = this.page.getByRole("textbox", { name: "Name" });
  clearFilters = this.page.getByRole("button", { name: "Clear filters" });

  // by the image title: one variation's name can be part of another's
  getCard(name: string) {
    return this.cards.filter({
      has: this.page.locator(`img[title="${name}"]`),
    });
  }

  deleteBtn(name: string) {
    return this.getCard(name).getByTestId(TEST_ID.deleteIcon);
  }

  async filterBy(field: string, option: string) {
    await this.page.locator(`#${filterChipId(field)}`).click();
    await this.page.getByRole("menuitemcheckbox", { name: option }).click();
    await this.page.keyboard.press("Escape");
  }
}
