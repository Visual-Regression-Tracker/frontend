import type { TestRunSortField } from "~client/types/testRunSort";
import { Table } from "./Table";

export class TestRunList extends Table {
  gridViewToggle = this.page.getByTestId("gridViewToggle");
  grid = this.page.getByTestId("testRunGrid");
  cards = this.page.getByTestId("testRunCard");
  cardTags = this.page.getByTestId("cardTags");
  // locators, not texts: assertions retry while the list re-renders
  cardNames = this.cards.getByTestId("cardName");
  diffToggle = this.page.getByTestId("showDiffToggle");
  viewMenuButton = this.page.getByTestId("viewMenuButton");

  // scoped: the build list pagination and selection bar carry the same labels
  pane = this.page.locator("#test-run-list");
  selectionBar = this.pane.getByRole("toolbar", { name: "Selection" });
  selectionBarSelectAll = this.selectionBar.getByRole("button", {
    name: /^Select all \d+$/,
  });
  approveBtn = this.selectionBar.getByRole("button", {
    name: "Approve",
    exact: true,
  });
  bulkApproveBtn = this.approveBtn;
  bulkRejectBtn = this.selectionBar.getByRole("button", {
    name: "Reject",
    exact: true,
  });
  downloadBtn = this.selectionBar.getByRole("button", { name: "Download zip" });
  nextPage = this.pane.getByLabel("Go to next page");
  pageSize = this.pane.getByLabel("Cards per page:");

  noiseChips = this.pane.getByTestId("noise-hint-chip");

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

  densityItem(density: "compact" | "standard" | "comfortable") {
    return this.page.getByTestId(`${density}Density`);
  }

  async setDensity(density: "compact" | "standard" | "comfortable") {
    await this.viewMenuButton.click();
    await this.densityItem(density).click();
  }

  async groupBy(mode: "none" | "variation") {
    await this.viewMenuButton.click();
    await this.page
      .getByTestId(mode === "none" ? "groupByNone" : "groupByVariation")
      .click();
  }

  noiseChip(rowId: string) {
    return this.getColumn(rowId, "noise").getByTestId("noise-hint-chip");
  }

  sortBy(field: TestRunSortField) {
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
