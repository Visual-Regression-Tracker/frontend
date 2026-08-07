import { Page } from "@playwright/test";

export class TestRunFilters {
  name = this.page.getByTestId("testRunNameFilter");
  tags = this.page.getByTestId("testRunTagFilter");

  constructor(public page: Page) {
    this.page = page;
  }

  selectedTag(tag: string) {
    return this.tags.locator(".MuiChip-label").filter({ hasText: tag });
  }
}
