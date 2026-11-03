import { AT_LEAST_TWO_CHARACTERS } from "../_helpers/validation";
import { ValidatedTextField } from "./ValidatedForm";

interface NameFieldProps {
  name: "firstName" | "lastName";
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
}

const NameField = ({ name, label, value, onChange }: NameFieldProps) => (
  <ValidatedTextField
    rules={AT_LEAST_TWO_CHARACTERS}
    id={name}
    name={name}
    value={value}
    label={label}
    type="text"
    variant="outlined"
    required
    fullWidth
    onChange={(event) => onChange(event.target.value)}
    slotProps={{ htmlInput: { "data-testid": name } }}
  />
);

export default NameField;
