import { BasePage } from "./BasePage";
import { AuthFields } from "./components/AuthFields";
import { LOCATOR_LOGIN_FORM, TEST_ID } from "~client/constants/locators";

export class LoginPage extends BasePage {
  private fields = new AuthFields(this.page);
  email = this.fields.email;
  password = this.fields.password;
  loginBtn = this.page.getByTestId(TEST_ID.loginBtn);
  showPasswordBtn = this.page.locator(
    "[aria-label='toggle password visibility']",
  );
  loginForm = this.page.locator(`#${LOCATOR_LOGIN_FORM}`);
  ssoBtn = this.page.getByTestId(TEST_ID.oidcLoginBtn);
  registerLink = this.page.getByText("Create an account");
}
