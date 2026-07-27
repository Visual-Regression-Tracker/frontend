import { Page } from "@playwright/test";

export class BuildList {
  buildList = this.page.locator("#build-list");
  searchInput = this.page.getByTestId("buildSearch");
  emptyMessage = this.page.getByTestId("buildListEmpty");

  constructor(public page: Page) {
    this.page = page;
  }

  getBuildLocator(number: number) {
    return this.buildList.getByText(`#${number}`);
  }
}
