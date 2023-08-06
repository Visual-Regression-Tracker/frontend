import React, { useState, FormEvent } from "react";
import {
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
} from "@material-ui/core";
import { useUserDispatch, login } from "../contexts";
import { usersService } from "../services";
import { useSnackbar } from "notistack";
import { TextValidator, ValidatorForm } from "react-material-ui-form-validator";
import { useNavigate } from "react-router-dom";
import { routes } from "../constants";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useUserDispatch();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    usersService
      .register(firstName, lastName, email, password)
      .then(() => {
        enqueueSnackbar("Successfully created account.", {
          variant: "success",
        });
        login(dispatch, email, password).then(() => navigate(routes.HOME));
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        })
      );
  };

  const errorForTwoChar = "Enter at least two characters.";

  return (
    <ValidatorForm onSubmit={handleSubmit} instantValidate>
      <Card variant="outlined">
        <CardContent>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <TextValidator
                validators={["minStringLength:2"]}
                errorMessages={[errorForTwoChar]}
                id="firstName"
                name="firstName"
                value={firstName}
                label={"First name"}
                type="text"
                variant="outlined"
                required
                fullWidth
                inputProps={{
                  onChange: (event: any) =>
                    setFirstName((event.target as HTMLInputElement).value),
                  "data-testId": "firstName",
                }}
              />
            </Grid>
            <Grid item>
              <TextValidator
                validators={["minStringLength:2"]}
                errorMessages={[errorForTwoChar]}
                id="lastName"
                name="lastName"
                value={lastName}
                label={"Last name"}
                type="text"
                variant="outlined"
                required
                fullWidth
                inputProps={{
                  onChange: (event: any) =>
                    setLastName((event.target as HTMLInputElement).value),
                  "data-testId": "lastName",
                }}
              />
            </Grid>
            <Grid item>
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
                  onChange: (event: any) =>
                    setEmail((event.target as HTMLInputElement).value),
                  "data-testId": "email",
                }}
              />
            </Grid>
            <Grid item>
              <TextValidator
                validators={["minStringLength:2"]}
                errorMessages={[errorForTwoChar]}
                id="password"
                name="password"
                value={password}
                label={"Password"}
                type="password"
                variant="outlined"
                required
                fullWidth
                inputProps={{
                  onChange: (event: any) =>
                    setPassword((event.target as HTMLInputElement).value),
                  "data-testId": "password",
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Grid container justifyContent="center">
            <Grid item>
              <Button
                type="submit"
                color="primary"
                variant="outlined"
                data-testId="submit"
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </CardActions>
      </Card>
    </ValidatorForm>
  );
};

export default RegisterForm;
