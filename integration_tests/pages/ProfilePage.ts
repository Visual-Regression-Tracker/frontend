import { BasePage } from "./BasePage";

export class ProfilePage extends BasePage {
  // each card is its own form with its own submit button
  userForm = this.page.locator("form").filter({ hasText: "User details" });
  firstName = this.userForm.getByTestId("firstName");
  lastName = this.userForm.getByTestId("lastName");
  email = this.userForm.getByTestId("email");
  updateUserBtn = this.userForm.getByTestId("submit");

  passwordForm = this.page
    .locator("form")
    .filter({ hasText: "Change password" });
  password = this.passwordForm.getByTestId("password");
  updatePasswordBtn = this.passwordForm.getByTestId("submit");

  apiKeyCard = this.page
    .locator(".MuiCard-root")
    .filter({ hasText: "Api key" });
  configFile = this.page.locator("#configFile");
  envVariables = this.page.locator("#envVariables");
  envVariablesTab = this.page.getByRole("tab", { name: "ENV variables" });
}
