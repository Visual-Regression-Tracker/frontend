import { useState, useEffect, FormEvent, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { useUserDispatch, login } from "../contexts";
import { LOCATOR_LOGIN_FORM, routes } from "../constants";
import { useSnackbar } from "notistack";
import { TextValidator, ValidatorForm } from "react-material-ui-form-validator";
import PasswordField from "../components/PasswordField";
import { usersService } from "../services";
import { OIDC_AUTO_REDIRECT } from "../_config/env.config";
import { useOidcEnabled } from "../_helpers/useOidcEnabled";
import { useRegistrationEnabled } from "../_helpers/useRegistrationEnabled";

const LoginForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useUserDispatch();
  const oidcEnabled = useOidcEnabled();
  const registrationEnabled = useRegistrationEnabled();
  // read on first render: LoginPage clears the fragment in an effect
  const [isOidcCallback] = useState(
    () =>
      window.location.hash.includes("token=") ||
      window.location.hash.includes("error="),
  );

  useEffect(() => {
    // redirecting during a callback would bounce back to the IdP
    if (
      oidcEnabled &&
      OIDC_AUTO_REDIRECT &&
      !isOidcCallback &&
      !usersService.isOidcLoggedOut()
    ) {
      usersService.startOidcLogin();
    }
  }, [oidcEnabled, isOidcCallback]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    login(dispatch, email, password)
      .then(() => {
        const locationState = location.state as { from: string } | null;
        navigate(locationState?.from ?? routes.HOME);
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
  };

  if (oidcEnabled === undefined) {
    return null;
  }

  if (oidcEnabled) {
    return (
      <Card>
        <CardContent id={LOCATOR_LOGIN_FORM} sx={{ p: 3 }}>
          <Button
            color="primary"
            variant="contained"
            size="large"
            fullWidth
            data-testid="oidcLoginBtn"
            onClick={() => usersService.startOidcLogin()}
          >
            Login with SSO
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ValidatorForm onSubmit={handleSubmit} instantValidate>
      <Card>
        <CardContent id={LOCATOR_LOGIN_FORM} sx={{ p: 3 }}>
          <Stack spacing={2}>
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
            <PasswordField password={password} setPassword={setPassword} />
            <Button
              type="submit"
              color="primary"
              variant="contained"
              size="large"
              fullWidth
              data-testid="loginBtn"
            >
              Login
            </Button>
          </Stack>
        </CardContent>
      </Card>
      {registrationEnabled && (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          mt={2}
        >
          New here?{" "}
          <MuiLink component={Link} to={routes.REGISTER} fontWeight={600}>
            Create an account
          </MuiLink>
        </Typography>
      )}
    </ValidatorForm>
  );
};

export default LoginForm;
