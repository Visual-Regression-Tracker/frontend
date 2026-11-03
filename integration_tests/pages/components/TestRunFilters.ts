import { PageObject } from "../PageObject";

export class TestRunFilters extends PageObject {
  name = this.page.getByTestId("testRunNameFilter");
  tags = this.page.getByTestId("testRunTagFilter");
  status = this.page.getByRole("combobox", { name: "Status" });

  async selectStatus(status: string) {
    await this.status.click();
    await this.page.getByRole("option", { name: status, exact: true }).click();
  }

  selectedTag(tag: string) {
    return this.tags.locator(".MuiChip-label").filter({ hasText: tag });
  }
}
