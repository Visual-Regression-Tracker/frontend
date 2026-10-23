import { Page } from "@playwright/test";

export class Modal {
  dialog = this.page.getByRole("dialog");
  confirmBtn = this.page.getByTestId("submitButton");
  cancelBtn = this.dialog.getByRole("button", { name: "Cancel" });

  constructor(public page: Page) {
    this.page = page;
  }
}
