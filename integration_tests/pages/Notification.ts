import { PageObject } from "./PageObject";
import { TEST_ID } from "~client/constants/locators";

export class Notification extends PageObject {
  message = this.page.locator("#notistack-snackbar");
  dismissBtn = this.page.getByTestId(TEST_ID.dismissNotification);
  toasts = this.page.locator(".notistack-MuiContent");

  messageWith(text: string) {
    return this.message.filter({ hasText: text });
  }

  toast(text: string) {
    return this.toasts.filter({ hasText: text });
  }

  undoBtn(text: string) {
    // by text: an open dialog hides the toasts from the accessibility tree
    return this.toast(text).locator("button", { hasText: /^Undo$/ });
  }
}
