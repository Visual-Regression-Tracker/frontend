import { BasePage } from "./BasePage";

export class ProfilePage extends BasePage {
  userForm = this.page.locator("form").filter({ hasText: "Your details" });
  firstName = this.userForm.getByTestId("firstName");
  lastName = this.userForm.getByTestId("lastName");
  email = this.userForm.getByTestId("email");
  role = this.userForm.getByTestId("role");
  updateUserBtn = this.userForm.getByTestId("submit");

  passwordForm = this.page.locator("form").filter({
    has: this.page.getByRole("button", { name: "Update password" }),
  });
  password = this.passwordForm.getByTestId("password");
  updatePasswordBtn = this.passwordForm.getByTestId("submit");

  apiKeyCard = this.page
    .locator(".MuiCard-root")
    .filter({ has: this.page.getByTestId("apiKey") });
  apiKey = this.apiKeyCard.getByTestId("apiKey");
  copyApiKeyBtn = this.apiKeyCard.getByRole("button", { name: "Copy" });
  regenerateBtn = this.apiKeyCard.getByRole("button", { name: "Regenerate…" });

  examplesCard = this.page
    .locator(".MuiCard-root")
    .filter({ hasText: "Configuration examples" });
  configFile = this.page.locator("#configFile");
  envVariables = this.page.locator("#envVariables");
  envVariablesBtn = this.examplesCard.getByRole("button", {
    name: "ENV variables",
  });
  copyExamplesBtn = this.examplesCard.getByRole("button", { name: "Copy" });
}
