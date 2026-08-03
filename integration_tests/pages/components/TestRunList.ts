import { Table } from "./Table";

export class TestRunList extends Table {
  downloadBtn = this.page.getByTestId("CloudDownloadIcon");
  gridViewToggle = this.page.getByTestId("gridViewToggle");
  tableViewToggle = this.page.getByTestId("tableViewToggle");
  grid = this.page.getByTestId("testRunGrid");
  cards = this.page.getByTestId("testRunCard");
  cardTags = this.page.getByTestId("cardTags");
  groupToggle = this.page.getByTestId("groupVariationsToggle");
  diffToggle = this.page.getByTestId("showDiffToggle");
  compactDensity = this.page.getByTestId("compactDensity");
  standardDensity = this.page.getByTestId("standardDensity");
  comfortableDensity = this.page.getByTestId("comfortableDensity");

  approveBtn = this.page.getByTestId("ThumbUpIcon");
  // scoped: the build list pagination carries the same aria labels
  pane = this.page.locator("#test-run-list");
  nextPage = this.pane.getByLabel("Go to next page");
  pageSize = this.pane.getByLabel("Cards per page:");

  rows = this.page.locator(".MuiDataGrid-row");
  selectAll = this.page.getByTestId("gridSelectAll");
  selectionCount = this.page.getByTestId("gridSelectionCount");

  cardNames() {
    return this.cards.getByTestId("cardName").allTextContents();
  }

  sortBy(field: "status" | "name" | "tags") {
    return this.page.getByTestId(`gridSort-${field}`).click();
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
