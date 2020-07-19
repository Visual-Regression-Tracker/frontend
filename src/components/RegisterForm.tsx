import React, { useState, FormEvent } from "react";
import {
  Button,
  Grid,
  TextField,
  Card,
  CardContent,
  CardActions,
} from "@material-ui/core";
import { useAuthDispatch, login } from "../contexts";
import { usersService } from "../services";
import { useSnackbar } from "notistack";

const RegisterForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAuthDispatch();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    usersService
      .register(firstName, lastName, email, password)
      .then(() => login(dispatch, email, password))
      .catch((err) =>
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
                id="firstName"
                name="firstName"
                value={firstName}
                label={"First name"}
                type="text"
                variant="outlined"
                required
                fullWidth
                inputProps={{
                  onChange: (event) =>
                    setFirstName((event.target as HTMLInputElement).value),
                  "data-testid": "firstName",
                }}
              />
            </Grid>
            <Grid item>
              <TextField
                id="lastName"
                name="lastName"
                value={lastName}
                label={"Last name"}
                type="text"
                variant="outlined"
                required
                fullWidth
                inputProps={{
                  onChange: (event) =>
                    setLastName((event.target as HTMLInputElement).value),
                  "data-testid": "lastName",
                }}
              />
            </Grid>
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
          <Grid container justify="center">
            <Grid item>
              <Button
                type="submit"
                color="primary"
                variant="outlined"
                data-testid="submit"
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </CardActions>
      </Card>
    </form>
  );
};

export default RegisterForm;
