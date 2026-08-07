import { Page } from "@playwright/test";

export class BuildList {
  buildList = this.page.locator("#build-list");
  searchInput = this.page.getByTestId("buildSearch");
  emptyMessage = this.page.getByTestId("buildListEmpty");
  scrollContainer = this.page.getByTestId("buildListScroll");
  selectAll = this.page.getByTestId("buildSelectAll");
  deleteSelectedBtn = this.page.getByTestId("buildDeleteSelected");

  constructor(public page: Page) {
    this.page = page;
  }

  getBuildLocator(number: number) {
    return this.buildList.getByText(`#${number}`);
  }

  goToPage(page: number) {
    return this.buildList.getByLabel(`Go to page ${page}`).click();
  }

  scrollTop() {
    return this.scrollContainer.evaluate((el) => el.scrollTop);
  }
}
