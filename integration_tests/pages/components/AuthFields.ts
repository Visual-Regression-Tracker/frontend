import { Locator, Page } from "@playwright/test";
import { TEST_ID } from "~client/constants/locators";

export class AuthFields {
  firstName: Locator;
  lastName: Locator;
  email: Locator;
  password: Locator;
  submit: Locator;

  constructor(scope: Page | Locator) {
    this.firstName = scope.getByTestId(TEST_ID.firstName);
    this.lastName = scope.getByTestId(TEST_ID.lastName);
    this.email = scope.getByTestId(TEST_ID.email);
    this.password = scope.getByTestId(TEST_ID.password);
    this.submit = scope.getByTestId(TEST_ID.submit);
  }
}
