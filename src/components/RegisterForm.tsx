import { useState, FormEvent } from "react";
import { Button, Card, CardContent, Stack } from "@mui/material";
import { useUserDispatch, login } from "../contexts";
import { usersService } from "../services";
import { useSnackbar } from "notistack";
import { ValidatorForm } from "react-material-ui-form-validator";
import { useNavigate } from "react-router-dom";
import { routes } from "../constants";
import PasswordField from "./PasswordField";
import EmailField from "./EmailField";
import NameField from "./NameField";

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

  return (
    <ValidatorForm onSubmit={handleSubmit} instantValidate>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <NameField
                name="firstName"
                label="First name"
                value={firstName}
                onChange={setFirstName}
              />
              <NameField
                name="lastName"
                label="Last name"
                value={lastName}
                onChange={setLastName}
              />
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
