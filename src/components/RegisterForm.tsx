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
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const dispatch = useAuthDispatch();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    usersService
      .register(firstName, lastName, email, password)
      .then(() => {
        enqueueSnackbar("Successfully created account.", {
          variant: "success",
        });
        login(dispatch, email, password);
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        })
      );
  };

  const isDataValid = () => {
    return (
      firstName.length > 0 &&
      lastName.length > 0 &&
      email.includes("@") &&
      password.length > 0
    );
  };

  const isTextboxFirstNameValid = firstName.length > 1;
  const isTextboxLastNameValid = lastName.length > 1;
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
                id="firstName"
                name="firstName"
                value={firstName}
                label={"First name"}
                type="text"
                variant="outlined"
                required
                fullWidth
                error={!isTextboxFirstNameValid && firstNameTouched}
                helperText={
                  (!isTextboxFirstNameValid && firstNameTouched)
                    ? "Enter at least 2 character."
                    : ""
                }
                inputProps={{
                  onChange: (event) => {
                    setFirstName((event.target as HTMLInputElement).value);
                    setFirstNameTouched(true);
                  },
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
                error={!isTextboxLastNameValid && lastNameTouched}
                helperText={
                  (!isTextboxLastNameValid && lastNameTouched)
                    ? "Enter at least 2 character."
                    : ""
                }
                inputProps={{
                  onChange: (event) =>{
                    setLastName((event.target as HTMLInputElement).value);
                    setLastNameTouched(true);
                  },
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
                error={!isEmailValid && emailTouched}
                helperText={
                  !isEmailFormatCorrect && emailTouched
                    ? "Enter valid email address."
                    : !isEmailLengthCorrect && emailTouched
                    ? "Email length should be at least 5."
                    : ""
                }
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
                helperText={
                  !isPasswordValid && passwordTouched
                    ? "Password of lenght at least 4."
                    : ""
                }
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
          <Grid container justify="center">
            <Grid item>
              <Button
                disabled={!isDataValid()}
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
