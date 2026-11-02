import { Table } from "./Table";

export class TestRunList extends Table {
  downloadBtn = this.page.getByTestId("CloudDownloadIcon");
  gridViewToggle = this.page.getByTestId("gridViewToggle");
  grid = this.page.getByTestId("testRunGrid");
  cards = this.page.getByTestId("testRunCard");
  cardTags = this.page.getByTestId("cardTags");
  // locators, not texts: assertions retry while the list re-renders
  cardNames = this.cards.getByTestId("cardName");
  groupToggle = this.page.getByTestId("groupVariationsToggle");
  diffToggle = this.page.getByTestId("showDiffToggle");
  compactDensity = this.page.getByTestId("compactDensity");
  standardDensity = this.page.getByTestId("standardDensity");
  comfortableDensity = this.page.getByTestId("comfortableDensity");

  approveBtn = this.page.getByTestId("ThumbUpIcon");
  bulkApproveBtn = this.page
    .getByRole("button")
    .filter({ has: this.approveBtn });
  bulkRejectBtn = this.page
    .getByLabel(/^Reject unresolved in selected /)
    .getByRole("button");
  // scoped: the build list pagination carries the same aria labels
  pane = this.page.locator("#test-run-list");
  nextPage = this.pane.getByLabel("Go to next page");
  pageSize = this.pane.getByLabel("Cards per page:");

  rows = this.page.locator(".MuiDataGrid-row");
  rowNames = this.rows.locator("[data-field='name']");
  selectAllRows = this.page.getByRole("checkbox", {
    name: /^(un)?select all rows$/i,
  });
  tableSelectionCount = this.page.locator(".MuiDataGrid-selectedRowCount");
  // scoped to the table: the build list above has a pager of its own
  tableNextPage = this.page
    .locator(".MuiDataGrid-root")
    .getByRole("button", { name: "Go to next page" });
  selectAll = this.page.getByTestId("gridSelectAll");
  selectionCount = this.page.getByTestId("gridSelectionCount");

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

  clickTag(tag: string) {
    return this.page
      .getByTestId("cardTag")
      .filter({ hasText: tag })
      .first()
      .click();
  }

  checkCard(name: string) {
    return this.getCard(name).getByRole("checkbox").check();
  }
}
