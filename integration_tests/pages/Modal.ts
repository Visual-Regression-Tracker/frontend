import { Locator } from "@playwright/test";
import { PageObject } from "./PageObject";
import { TEST_ID } from "~client/constants/locators";

export class Modal extends PageObject {
  dialog = this.page.getByRole("dialog");
  confirmBtn = this.page.getByTestId(TEST_ID.submitButton);
  cancelBtn = this.dialog.getByRole("button", { name: "Cancel" });

  fieldError(message: string): Locator {
    return this.dialog.getByText(message);
  }
}
