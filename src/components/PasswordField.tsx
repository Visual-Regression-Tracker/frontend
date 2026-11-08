import {
  useState,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from "react";
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { AT_LEAST_TWO_CHARACTERS } from "../_helpers/validation";
import { ValidatedTextField } from "./ValidatedForm";
import { TEST_ID } from "../constants/locators";

interface PasswordFieldProps {
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  label?: string;
}

const PasswordField = ({
  password,
  setPassword,
  label = "Password",
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <ValidatedTextField
      rules={AT_LEAST_TWO_CHARACTERS}
      id="password"
      name="password"
      value={password}
      label={label}
      type={showPassword ? "text" : "password"}
      variant="outlined"
      required
      fullWidth
      onChange={(event) => setPassword(event.target.value)}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
        htmlInput: { "data-testid": TEST_ID.password },
      }}
    />
  );
};

export default PasswordField;
