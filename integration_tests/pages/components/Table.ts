import { Locator } from "@playwright/test";
import { PageObject } from "../PageObject";

export class Table extends PageObject {
  getRow(rowId: string): Locator {
    return this.page.locator(`[data-id='${rowId}']`);
  }

  getColumn(rowId: string, name: string) {
    return this.getRow(rowId).locator(`[data-field='${name}']`);
  }

  async checkRow(id: string) {
    await this.getColumn(id, "__check__").click();
  }
}
