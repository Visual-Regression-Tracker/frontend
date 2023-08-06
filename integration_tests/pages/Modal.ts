import { Page } from "@playwright/test";

export class Modal {

    confirmBtn = this.page.getByTestId('submitButton');

    constructor(public page: Page) {
        this.page = page;
    }
}