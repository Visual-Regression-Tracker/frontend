import { useState, FormEvent, type ChangeEvent } from "react";
import { Button, Card, CardContent, Stack } from "@mui/material";
import { useUserDispatch, login } from "../contexts";
import { usersService } from "../services";
import { useSnackbar } from "notistack";
import { TextValidator, ValidatorForm } from "react-material-ui-form-validator";
import { useNavigate } from "react-router-dom";
import { routes } from "../constants";
import PasswordField from "./PasswordField";
import EmailField from "./EmailField";

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
        return login(dispatch, email, password).then(() =>
          navigate(routes.HOME),
        );
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
  };

  const errorForTwoChar = "Enter at least two characters.";

  const nameField = (
    name: "firstName" | "lastName",
    label: string,
    value: string,
    setValue: (value: string) => void,
  ) => (
    <TextValidator
      validators={["minStringLength:2"]}
      errorMessages={[errorForTwoChar]}
      id={name}
      name={name}
      value={value}
      label={label}
      type="text"
      variant="outlined"
      required
      fullWidth
      inputProps={{
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          setValue(event.target.value),
        "data-testid": name,
      }}
    />
  );

  return (
    <ValidatorForm onSubmit={handleSubmit} instantValidate>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              {nameField("firstName", "First name", firstName, setFirstName)}
              {nameField("lastName", "Last name", lastName, setLastName)}
            </Stack>
            <EmailField email={email} setEmail={setEmail} />
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
