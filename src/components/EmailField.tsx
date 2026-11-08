import { isEmail } from "../_helpers/validation";
import { ValidatedTextField } from "./ValidatedForm";
import { TEST_ID } from "../constants/locators";

const EMAIL_RULES = [isEmail("Enter a valid email.")];

interface EmailFieldProps {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
}

const EmailField = ({
  value,
  onChange,
  disabled,
  helperText,
}: EmailFieldProps) => (
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
    helperText={helperText}
    onChange={(event) => onChange(event.target.value)}
    slotProps={{ htmlInput: { "data-testid": TEST_ID.email } }}
  />
);

export default EmailField;
