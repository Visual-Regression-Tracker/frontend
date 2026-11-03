import { isEmail } from "../_helpers/validation";
import { ValidatedTextField } from "./ValidatedForm";

const EMAIL_RULES = [isEmail("Enter a valid email.")];

interface EmailFieldProps {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const EmailField = ({ value, onChange, disabled }: EmailFieldProps) => (
  <ValidatedTextField
    rules={EMAIL_RULES}
    id="email"
    name="email"
    value={value}
    label={"Email address"}
    type="text"
    variant="outlined"
    required
    fullWidth
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    slotProps={{ htmlInput: { "data-testid": "email" } }}
  />
);

export default EmailField;
