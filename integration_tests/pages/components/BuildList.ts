import { Page } from "@playwright/test";

export class BuildList {
  buildList = this.page.locator("#build-list");
  searchInput = this.page.getByTestId("buildSearch");
  emptyMessage = this.page.getByTestId("buildListEmpty");
  errorMessage = this.page.getByTestId("buildListError");
  scrollContainer = this.page.getByTestId("buildListScroll");
  selectAll = this.page.getByTestId("buildSelectAll");
  deleteSelectedBtn = this.page.getByTestId("buildDeleteSelected");
  currentPage = this.buildList.locator('[aria-current="page"]');

  constructor(public page: Page) {
    this.page = page;
  }

  menu = this.page.getByRole("menu");
  ciBuildIdInput = this.page.getByTestId("newCiBuildId");

  getBuildItem(number: number) {
    // "#1" is also the start of "#10"
    return this.buildList
      .locator(".MuiListItemButton-root")
      .filter({ hasText: new RegExp(String.raw`#${number}(?!\d)`) });
  }

  // the menu button only shows while the pointer is over the build
  async openMenu(number: number) {
    const item = this.getBuildItem(number);
    await item.hover();
    await item.getByTestId("MoreVertIcon").click();
  }

  menuItem(name: "Stop" | "Edit CI Build" | "Delete") {
    return this.menu.getByRole("menuitem", { name, exact: true });
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
