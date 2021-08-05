import React, { useState, FormEvent, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
} from "@material-ui/core";
import { useAuthDispatch, login, HelpContext } from "../contexts";
import { routes } from "../constants";
import { useSnackbar } from "notistack";
import { TextValidator, ValidatorForm } from "react-material-ui-form-validator";

const LoginForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useUserDispatch();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    login(dispatch, email, password).catch((err) =>
      enqueueSnackbar(err, {
        variant: "error",
      })
    );
  };

  const helpSteps = [
    {
      target: "#loginform-1",
      content: "Default admin account: visual-regression-tracker@example.com / 123456. Make sure to change it's password.",
    },
  ];
  
  useEffect(() => {
    populateHelpSteps(helpSteps);
  });

  const { populateHelpSteps } = useContext(HelpContext);

  const errorForTwoChar = "Enter at least two characters.";
  const locatorLoginForm = "loginform-1";

  return (
    <ValidatorForm onSubmit={handleSubmit} instantValidate>
      <Card variant="outlined">
        <CardContent id={locatorLoginForm}>
          <Grid container direction="column" spacing={2}>
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
                  "data-testid": "email",
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
    </ValidatorForm>
  );
};

export default LoginForm;
