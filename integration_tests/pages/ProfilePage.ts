import { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { AuthFields } from "./components/AuthFields";
import { ELEMENT_ID, TEST_ID } from "~client/constants/locators";

export class ProfilePage extends BasePage {
  userForm = this.page.locator("form").filter({ hasText: "Your details" });
  private userFields = new AuthFields(this.userForm);
  firstName = this.userFields.firstName;
  lastName = this.userFields.lastName;
  email = this.userFields.email;
  role = this.userForm.getByTestId(TEST_ID.role);
  updateUserBtn = this.userFields.submit;
  heading = this.page.getByRole("heading", { name: "Profile" });

  passwordForm = this.page.locator("form").filter({
    has: this.page.getByRole("button", { name: "Update password" }),
  });
  private passwordFields = new AuthFields(this.passwordForm);
  password = this.passwordFields.password;
  updatePasswordBtn = this.passwordFields.submit;

  apiKeyCard = this.page
    .locator(".MuiCard-root")
    .filter({ has: this.page.getByTestId(TEST_ID.apiKey) });
  apiKey = this.apiKeyCard.getByTestId(TEST_ID.apiKey);
  copyApiKeyBtn = this.apiKeyCard.getByRole("button", { name: "Copy" });
  regenerateBtn = this.apiKeyCard.getByRole("button", { name: "Regenerate…" });

  examplesCard = this.page
    .locator(".MuiCard-root")
    .filter({ hasText: "Configuration examples" });
  configFile = this.page.locator(`#${ELEMENT_ID.configFile}`);
  envVariables = this.page.locator(`#${ELEMENT_ID.envVariables}`);
  envVariablesBtn = this.examplesCard.getByRole("button", {
    name: "ENV variables",
  });
  copyExamplesBtn = this.examplesCard.getByRole("button", { name: "Copy" });

  fieldError(message: string): Locator {
    return this.userNote(message);
  }

  userNote(text: string): Locator {
    return this.userForm.getByText(text);
  }
}
