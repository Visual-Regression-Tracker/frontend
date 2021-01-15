import React, { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Grid,
  TextField,
  Card,
  CardContent,
  CardActions,
  Typography,
} from "@material-ui/core";
import { useAuthDispatch, login } from "../contexts";
import { routes } from "../constants";
import { useSnackbar } from "notistack";

const LoginForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [password, setPassword] = useState("");
  const dispatch = useAuthDispatch();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    login(dispatch, email, password).catch((err) =>
      enqueueSnackbar(err, {
        variant: "error",
      })
    );
  };

  const isDataValid = () => {
    return isEmailValid && isPasswordValid;
  };

  const isEmailLengthCorrect = email.length > 4;
  const isEmailFormatCorrect = email.includes(".") && email.includes("@");
  const isEmailValid = isEmailFormatCorrect && isEmailLengthCorrect;
  const isPasswordValid = password.length > 3;

  return (
    <form onSubmit={handleSubmit}>
      <Card variant="outlined">
        <CardContent>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <TextField
                id="email"
                name="email"
                value={email}
                label={"Email address"}
                type="text"
                variant="outlined"
                error={!isEmailValid && emailTouched}
                helperText={
                  (!isEmailFormatCorrect && emailTouched)
                    ? "Enter valid email address."
                    : (!isEmailLengthCorrect && emailTouched)
                    ? "Email length should be at least 5."
                    : ""
                }
                required
                fullWidth
                inputProps={{
                  onChange: (event) => {
                    setEmail((event.target as HTMLInputElement).value);
                    setEmailTouched(true);
                  },
                  "data-testid": "email",
                }}
              />
            </Grid>

            <Grid item>
              <TextField
                id="password"
                name="password"
                value={password}
                label={"Password"}
                type="password"
                variant="outlined"
                required
                fullWidth
                error={!isPasswordValid && passwordTouched}
                helperText={!isPasswordValid && passwordTouched ? "Password of lenght at least 4." : ""}
                inputProps={{
                  onChange: (event) => {
                    setPassword((event.target as HTMLInputElement).value);
                    setPasswordTouched(true);
                  },
                  "data-testid": "password",
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Grid container direction="column" justify="center" spacing={3}>
            <Grid item>
              <Button
                disabled={!isDataValid()}
                type="submit"
                color="primary"
                variant="outlined"
                data-testid="loginBtn"
              >
                Login
              </Button>
            </Grid>
            <Grid item>
              <Typography component={Link} to={routes.REGISTER}>
                Create an account
              </Typography>
            </Grid>
          </Grid>
        </CardActions>
      </Card>
    </form>
  );
};

export default LoginForm;
