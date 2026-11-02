import type { ChangeEvent } from "react";
import { TextValidator } from "react-material-ui-form-validator";

interface NameFieldProps {
  name: "firstName" | "lastName";
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
}

const NameField = ({ name, label, value, onChange }: NameFieldProps) => (
  <TextValidator
    validators={["minStringLength:2"]}
    errorMessages={["Enter at least two characters."]}
    id={name}
    name={name}
    value={value}
    label={label}
    type="text"
    variant="outlined"
    required
    fullWidth
    inputProps={{
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value),
      "data-testid": name,
    }}
  />
);

export default NameField;
