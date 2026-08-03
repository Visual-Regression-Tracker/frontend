import { Table } from "./Table";

export class TestRunList extends Table {
  downloadBtn = this.page.getByTestId("CloudDownloadIcon");
  gridViewToggle = this.page.getByTestId("gridViewToggle");
  tableViewToggle = this.page.getByTestId("tableViewToggle");
  grid = this.page.getByTestId("testRunGrid");
  cards = this.page.getByTestId("testRunCard");

  getCard(name: string) {
    return this.cards.filter({ hasText: name });
  }
}
