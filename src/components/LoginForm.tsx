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
                required
                fullWidth
                inputProps={{
                  onChange: (event) =>
                    setEmail((event.target as HTMLInputElement).value),
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
                inputProps={{
                  onChange: (event) =>
                    setPassword((event.target as HTMLInputElement).value),
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
