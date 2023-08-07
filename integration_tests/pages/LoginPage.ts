import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  email = this.page.getByTestId("email");
  password = this.page.getByTestId("password");
  loginBtn = this.page.getByTestId("loginBtn");
}
