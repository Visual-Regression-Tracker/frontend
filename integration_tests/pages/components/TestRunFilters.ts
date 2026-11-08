import { PageObject } from "../PageObject";

type FilterChip =
  "os" | "browser" | "viewport" | "device" | "customTags" | "noise";

export class TestRunFilters extends PageObject {
  name = this.page.getByTestId("testRunNameFilter");
  noiseHint = this.chip("noise");
  chipOptions = this.page.getByRole("menuitemcheckbox");
  clearFilters = this.page.getByRole("button", { name: "Clear filters" });
  statusFilter = this.page.getByRole("group", { name: "Filter by status" });

  chip(id: FilterChip) {
    return this.page.locator(`#filter-chip-${id}`);
  }

  async selectStatus(status: string) {
    const label = status.charAt(0).toUpperCase() + status.slice(1);
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

  async selectNoiseHint(option: string) {
    await this.pick("noise", option);
  }
}
