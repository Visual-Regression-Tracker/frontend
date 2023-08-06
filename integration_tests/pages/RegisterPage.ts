import { BasePage } from "./BasePage";

export class RegisterPage extends BasePage {
  firstName = this.page.getByTestId("firstName");
  lastName = this.page.getByTestId("lastName");
  email = this.page.getByTestId("email");
  password = this.page.getByTestId("password");
  registerBtn = this.page.getByTestId("submit");
}
