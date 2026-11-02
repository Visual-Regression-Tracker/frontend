import type { ChangeEvent } from "react";
import { TextValidator } from "react-material-ui-form-validator";

interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const EmailField = ({ value, onChange }: EmailFieldProps) => (
  <TextValidator
    validators={["isEmail"]}
    errorMessages={["Enter a valid email."]}
    id="email"
    name="email"
    value={value}
    label={"Email address"}
    type="text"
    variant="outlined"
    required
    fullWidth
    inputProps={{
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value),
      "data-testid": "email",
    }}
  />
);

export default EmailField;
