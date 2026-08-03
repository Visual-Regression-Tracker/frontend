import { Page } from "@playwright/test";

export class TestRunFilters {
  name = this.page.getByTestId("testRunNameFilter");

  constructor(public page: Page) {
    this.page = page;
  }
}
