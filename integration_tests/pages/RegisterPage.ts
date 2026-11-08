import { BasePage } from "./BasePage";
import { AuthFields } from "./components/AuthFields";

export class RegisterPage extends BasePage {
  private fields = new AuthFields(this.page);
  firstName = this.fields.firstName;
  lastName = this.fields.lastName;
  email = this.fields.email;
  password = this.fields.password;
  registerBtn = this.fields.submit;
  disabledNotice = this.text(
    "Registration is turned off. Ask an administrator for an account.",
  );
}
