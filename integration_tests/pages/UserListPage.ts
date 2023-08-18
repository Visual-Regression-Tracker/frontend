import { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { type Role } from "~client/types";

export class UserListPage extends BasePage {
  private getRow(userId: string): Locator {
    return this.page.locator(`[data-id='${userId}']`);
  }

  async changeRole(userId: string, role: keyof typeof Role) {
    await this.getRow(userId).locator("[data-field='role']").dblclick();
    await this.page.locator(`[data-value='${role}']`).click();

    return this.page.keyboard.press("Enter");
  }
}
