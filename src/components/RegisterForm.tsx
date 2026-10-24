import React, { useState, FormEvent } from "react";
import { Button, Card, CardContent, Stack } from "@mui/material";
import { useUserDispatch, login } from "../contexts";
import { usersService } from "../services";
import { useSnackbar } from "notistack";
import { TextValidator, ValidatorForm } from "react-material-ui-form-validator";
import { useNavigate } from "react-router-dom";
import { routes } from "../constants";
import PasswordField from "../components/PasswordField";

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
        }),
      );
  };

  const errorForTwoChar = "Enter at least two characters.";

  return (
    <ValidatorForm onSubmit={handleSubmit} instantValidate>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    setFirstName(event.target.value),
                  "data-testid": "firstName",
                }}
              />
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
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                    setLastName(event.target.value),
                  "data-testid": "lastName",
                }}
              />
            </Stack>
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
              data-testid="submit"
            >
              Submit
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </ValidatorForm>
  );
};

export default RegisterForm;
