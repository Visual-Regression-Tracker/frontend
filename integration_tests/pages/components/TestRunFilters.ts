import { PageObject } from "../PageObject";
import { TEST_ID, filterChipId } from "~client/constants/locators";

type FilterChip = "os" | "browser" | "viewport" | "device" | "customTags";

export class TestRunFilters extends PageObject {
  name = this.page.getByTestId(TEST_ID.testRunNameFilter);
  chipOptions = this.page.getByRole("menuitemcheckbox");
  clearFilters = this.page.getByRole("button", { name: "Clear filters" });
  statusFilter = this.page.getByRole("group", { name: "Filter by status" });
  statusChips = this.statusFilter.getByRole("button");

  chip(id: FilterChip) {
    return this.page.locator(`#${filterChipId(id)}`);
  }

  async selectStatus(label: string) {
    await this.statusFilter
      .getByRole("button", { name: new RegExp(String.raw`^${label} \d+$`) })
      .click();
  }

  async pick(id: FilterChip, option: string) {
    await this.chip(id).click();
    await this.page
      .getByRole("menuitemcheckbox", { name: option, exact: true })
      .click();
    await this.page.keyboard.press("Escape");
  }
}
