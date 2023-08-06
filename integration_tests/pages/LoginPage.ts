import { Page } from "@playwright/test";

export class LoginPage {
    email = this.page.getByTestId('email');
    password = this.page.getByTestId('password');
    loginBtn = this.page.getByTestId('loginBtn');

    constructor(public page: Page) {
        this.page = page;
    }
}