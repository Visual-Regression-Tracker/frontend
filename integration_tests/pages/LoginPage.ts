import { BasePage } from "./BasePage";
import { LOCATOR_LOGIN_FORM } from "~client/constants/help";

export class LoginPage extends BasePage {
  email = this.page.getByTestId("email");
  password = this.page.getByTestId("password");
  loginBtn = this.page.getByTestId("loginBtn");
  showPasswordBtn = this.page.locator(
    "[aria-label='toggle password visibility']",
  );
  loginForm = this.page.locator(`#${LOCATOR_LOGIN_FORM}`);
}
