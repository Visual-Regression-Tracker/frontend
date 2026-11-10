import type { Locator } from "@playwright/test";
import type { TestRunSortField } from "~client/types/testRunSort";
import { Table } from "./Table";
import {
  LOCATOR_PROJECT_PAGE_TEST_RUN_LIST,
  TEST_ID,
  gridSortTestId,
} from "~client/constants/locators";

// the data grid colours its own subtree: left alone its chrome inherits pure black
const colourOf = (locator: Locator) =>
  locator.evaluate((el: HTMLElement) => getComputedStyle(el).color);

export class TestRunList extends Table {
  gridViewToggle = this.page.getByTestId(TEST_ID.gridViewToggle);
  grid = this.page.getByTestId(TEST_ID.testRunGrid);
  cards = this.page.getByTestId(TEST_ID.testRunCard);
  cardTags = this.page.getByTestId(TEST_ID.cardTags);
  // locators, not texts: assertions retry while the list re-renders
  cardNames = this.cards.getByTestId(TEST_ID.cardName);

  // scoped: the build list pagination and selection bar carry the same labels
  pane = this.page.locator(`#${LOCATOR_PROJECT_PAGE_TEST_RUN_LIST}`);
  selectionBar = this.pane.getByRole("toolbar", { name: "Selection" });
  selectionBarSelectAll = this.selectionBar.getByRole("button", {
    name: /^Select all \d+$/,
  });
  approveBtn = this.selectionBar.getByRole("button", {
    name: "Approve",
    exact: true,
  });
  bulkRejectBtn = this.selectionBar.getByRole("button", {
    name: "Reject",
    exact: true,
  });
  analyseBtn = this.selectionBar.getByRole("button", {
    name: "Analyse noise",
  });
  deleteBtn = this.selectionBar.getByRole("button", { name: "Delete…" });
  downloadBtn = this.selectionBar.getByRole("button", { name: "Download zip" });
  nextPage = this.pane.getByLabel("Go to next page");
  pageSize = this.pane.getByLabel("Cards per page:");

  noiseChips = this.pane.getByTestId(TEST_ID.noiseHintChip);
  progress = this.pane.getByRole("progressbar");
  noiseColumnHeader = this.pane.locator(
    ".MuiDataGrid-columnHeader[data-field='noise']",
  );

  rows = this.page.locator(".MuiDataGrid-row");
  rowNames = this.rows.locator("[data-field='name'] p");
  selectAllRows = this.page.getByRole("checkbox", {
    name: /^(un)?select all rows$/i,
  });
  tableSelectionCount = this.selectionBar;
  // scoped to the table: the build list above has a pager of its own
  tableNextPage = this.page
    .locator(".MuiDataGrid-root")
    .getByRole("button", { name: "Go to next page" });
  selectAll = this.page.getByTestId(TEST_ID.gridSelectAll);
  selectionCount = this.page.getByTestId(TEST_ID.gridSelectionCount);

  rowCheckbox(rowId: string) {
    return this.getRow(rowId).getByRole("checkbox");
  }

  rowName(text: string) {
    return this.rowNames.getByText(text);
  }

  clearSelectionBtn = this.selectionBar.getByRole("button", {
    name: "Clear selection",
  });
  firstCardImage = this.cards.first().locator("img");
  gridSortName = this.page.getByTestId(gridSortTestId("name"));

  tableHeaderColour() {
    return colourOf(
      this.page.locator(".MuiDataGrid-columnHeaderTitle").first(),
    );
  }

  gridSortNameColour() {
    return colourOf(this.gridSortName);
  }

  noiseChip(rowId: string) {
    return this.getColumn(rowId, "noise").getByTestId(TEST_ID.noiseHintChip);
  }

  sortBy(field: TestRunSortField) {
    return this.page.getByTestId(gridSortTestId(field)).click();
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
      .getByTestId(TEST_ID.cardTag)
      .filter({ hasText: tag })
      .first()
      .click();
  }

  checkCard(name: string) {
    return this.getCard(name).getByRole("checkbox").check();
  }
}
