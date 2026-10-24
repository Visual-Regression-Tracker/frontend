import React, { useState, useEffect, FormEvent } from "react";
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

const LoginForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useUserDispatch();
  const oidcEnabled = useOidcEnabled();
  // Captured during the first render: LoginPage clears the fragment in an
  // effect, before the async OIDC flag below has resolved.
  const [isOidcCallback] = useState(
    () =>
      window.location.hash.includes("token=") ||
      window.location.hash.includes("error="),
  );

  useEffect(() => {
    // Do not auto-redirect while a callback result (token/error) is being
    // processed by LoginPage, otherwise we would bounce back to the IdP.
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
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
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
    </ValidatorForm>
  );
};

export default LoginForm;
