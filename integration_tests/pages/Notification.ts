import { Page } from "@playwright/test";

export class Notification {

    message = this.page.locator('#notistack-snackbar');

    constructor(public page: Page) {
        this.page = page;
    }
}