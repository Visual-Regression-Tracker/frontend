import { Page } from "@playwright/test";

export class Notification {
  message = this.page.locator("#notistack-snackbar");
  dismissBtn = this.page.getByTestId("dismissNotification");

  constructor(public page: Page) {
    this.page = page;
  }

  toast(text: string) {
    return this.page.locator(".notistack-MuiContent", { hasText: text });
  }

  undoBtn(text: string) {
    // by text: an open dialog hides the toasts from the accessibility tree
    return this.toast(text).locator("button", { hasText: /^Undo$/ });
  }
}
