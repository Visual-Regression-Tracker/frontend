import { PageObject } from "../PageObject";

export class TestRunFilters extends PageObject {
  name = this.page.getByTestId("testRunNameFilter");
  tags = this.page.getByTestId("testRunTagFilter");
  status = this.page.getByRole("combobox", { name: "Status" });
  noiseHint = this.page.getByRole("combobox", { name: "Noise hint" });
  noiseHintOptions = this.page.getByRole("option");

  async selectStatus(status: string) {
    await this.status.click();
    await this.page.getByRole("option", { name: status, exact: true }).click();
  }

  async selectNoiseHint(option: string) {
    await this.noiseHint.click();
    await this.page.getByRole("option", { name: option, exact: true }).click();
    await this.page.keyboard.press("Escape");
  }

  selectedTag(tag: string) {
    return this.tags.locator(".MuiChip-label").filter({ hasText: tag });
  }
}
