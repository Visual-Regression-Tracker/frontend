import { Table } from "./Table";

export class TestRunList extends Table {
  downloadBtn = this.page.getByTestId("CloudDownloadIcon");
  gridViewToggle = this.page.getByTestId("gridViewToggle");
  tableViewToggle = this.page.getByTestId("tableViewToggle");
  grid = this.page.getByTestId("testRunGrid");
  cards = this.page.getByTestId("testRunCard");
  groupToggle = this.page.getByTestId("groupVariationsToggle");
  compactDensity = this.page.getByTestId("compactDensity");
  standardDensity = this.page.getByTestId("standardDensity");
  comfortableDensity = this.page.getByTestId("comfortableDensity");

  approveBtn = this.page.getByTestId("ThumbUpIcon");
  // scoped: the build list pagination carries the same aria labels
  pane = this.page.locator("#test-run-list");
  nextPage = this.pane.getByLabel("Go to next page");
  pageSize = this.pane.getByLabel("Cards per page");

  sortButton = this.page.getByTestId("gridSort");

  cardNames() {
    return this.cards.getByTestId("cardName").allTextContents();
  }

  async sortBy(option: string) {
    await this.sortButton.click();
    await this.page.getByRole("menuitem", { name: option }).click();
  }

  async setPageSize(size: number) {
    await this.pageSize.click();
    await this.page.getByRole("option", { name: String(size) }).click();
  }

  getCard(name: string) {
    return this.cards.filter({ hasText: name });
  }

  checkCard(name: string) {
    return this.getCard(name).getByRole("checkbox").check();
  }
}
