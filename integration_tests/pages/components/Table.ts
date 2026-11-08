import { Locator } from "@playwright/test";
import { PageObject } from "../PageObject";

export class Table extends PageObject {
  getRow(rowId: string): Locator {
    return this.page.locator(`[data-id='${rowId}']`);
  }

  getColumn(rowId: string, name: string) {
    return this.getRow(rowId).locator(`[data-field='${name}']`);
  }

  columnHeader(name: string | RegExp): Locator {
    return this.page.getByRole("columnheader", { name });
  }

  checkbox(rowId: string): Locator {
    return this.getColumn(rowId, "__check__").getByRole("checkbox");
  }

  rowIds(): Promise<(string | null)[]> {
    return this.page
      .locator(".MuiDataGrid-row")
      .evaluateAll((rows) => rows.map((row) => row.getAttribute("data-id")));
  }

  async checkRow(id: string) {
    await this.getColumn(id, "__check__").click();
  }
}
