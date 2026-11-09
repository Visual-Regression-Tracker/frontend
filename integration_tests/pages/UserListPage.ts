import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Role } from "~client/types";
import { Table } from "./components/Table";

export class UserListPage extends BasePage {
  table: Table;
  searchField = this.page.getByLabel("Search by name or email");
  roleFilter = this.page.getByRole("button", { name: /^Role/ });
  guestBanner = this.page.getByRole("alert");
  showGuestsBtn = this.page.getByRole("button", { name: "Show Guests" });
  selectionBar = this.page.getByRole("toolbar", { name: "Selection" });
  changeRoleBtn = this.selectionBar.getByRole("button", {
    name: "Change role",
  });
  deleteSelectedBtn = this.selectionBar.getByRole("button", {
    name: "Delete…",
  });

  constructor(page: Page) {
    super(page);
    this.table = new Table(page);
  }

  roleSelect(userId: string) {
    return this.table.getColumn(userId, "role").getByRole("combobox");
  }

  async changeRole(userId: string, role: keyof typeof Role) {
    await this.roleSelect(userId).click();

    return this.page.getByRole("option", { name: Role[role] }).click();
  }
}
