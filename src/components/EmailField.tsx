import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { TextValidator } from "react-material-ui-form-validator";

interface EmailFieldProps {
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
}

const EmailField = ({ email, setEmail }: EmailFieldProps) => (
  <TextValidator
    validators={["isEmail"]}
    errorMessages={["Enter a valid email."]}
    id="email"
    name="email"
    value={email}
    label={"Email address"}
    type="text"
    variant="outlined"
    required
    fullWidth
    inputProps={{
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        setEmail(event.target.value),
      "data-testid": "email",
    }}
  />
);

export default EmailField;
