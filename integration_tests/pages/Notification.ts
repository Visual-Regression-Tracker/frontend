import { Page } from "@playwright/test";

export class Notification {
  message = this.page.locator("#notistack-snackbar");
  dismissBtn = this.page.getByTestId("dismissNotification");

  constructor(public page: Page) {
    this.page = page;
  }
}
