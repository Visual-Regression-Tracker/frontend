import { PageObject } from "../PageObject";
import {
  LOCATOR_PROJECT_PAGE_BUILD_LIST,
  TEST_ID,
} from "~client/constants/locators";

export class BuildList extends PageObject {
  buildList = this.page.locator(`#${LOCATOR_PROJECT_PAGE_BUILD_LIST}`);
  searchInput = this.page.getByTestId(TEST_ID.buildSearch);
  emptyMessage = this.page.getByTestId(TEST_ID.buildListEmpty);
  errorMessage = this.page.getByTestId(TEST_ID.buildListError);
  scrollContainer = this.page.getByTestId(TEST_ID.buildListScroll);
  selectAll = this.page.getByTestId(TEST_ID.buildSelectAll);
  selectionBar = this.buildList.getByRole("toolbar", { name: "Selection" });
  deleteSelectedBtn = this.selectionBar.getByRole("button", {
    name: "Delete…",
  });
  selectAllMatchingBtn = this.selectionBar.getByRole("button", {
    name: /^Select all \d+$/,
  });
  currentPage = this.buildList.locator('[aria-current="page"]');

  ciBuildIdInput = this.page.getByTestId(TEST_ID.newCiBuildId);

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
    await item.getByRole("button", { name: "Build menu" }).click();
  }

  menuItem(name: "Stop build" | "Edit CI build id…" | "Delete build…") {
    return this.menu.getByRole("menuitem", { name, exact: true });
  }

  getBuildLocator(number: number) {
    return this.buildList.getByText(`#${number}`);
  }

  goToPage(page: number) {
    return this.buildList.getByLabel(`Go to page ${page}`).click();
  }

  buildCheckboxFrame(number: number) {
    return this.getBuildItem(number).locator(".MuiCheckbox-root");
  }

  buildCheckbox(number: number) {
    return this.getBuildItem(number).getByRole("checkbox");
  }

  emptyMessageOverflow() {
    return this.emptyMessage.evaluate((el) => el.scrollWidth - el.clientWidth);
  }

  scrollToBottom() {
    return this.scrollContainer.evaluate((el) =>
      el.scrollTo(0, el.scrollHeight),
    );
  }

  scrollTop() {
    return this.scrollContainer.evaluate((el) => el.scrollTop);
  }
}
