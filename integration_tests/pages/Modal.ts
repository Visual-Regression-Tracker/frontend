import { PageObject } from "./PageObject";

export class Modal extends PageObject {
  dialog = this.page.getByRole("dialog");
  confirmBtn = this.page.getByTestId("submitButton");
  cancelBtn = this.dialog.getByRole("button", { name: "Cancel" });
}
