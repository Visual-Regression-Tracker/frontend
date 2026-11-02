import { useState, FormEvent, type ChangeEvent } from "react";
import {
  GridLegacy as Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  CardHeader,
  Select,
  MenuItem,
  Container,
} from "@mui/material";
import { PageHeader } from "../components/PageHeader";
import { useUserDispatch, useUserState, update } from "../contexts";
import { usersService } from "../services";
import { useSnackbar } from "notistack";
import { ConfigurationExamples } from "../components/ConfigurationExamples";
import { TextValidator, ValidatorForm } from "react-material-ui-form-validator";
import { Role } from "../types";
import PasswordField from "../components/PasswordField";
import NameField from "../components/NameField";
import { useOidcEnabled } from "../_helpers/useOidcEnabled";

const ProfilePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useUserState();
  const authDispatch = useUserDispatch();
  const [email, setEmail] = useState(user?.email);
  const [firstName, setFirstName] = useState(user?.firstName);
  const [lastName, setLastName] = useState(user?.lastName);
  const [password, setPassword] = useState("");
  const oidcEnabled = useOidcEnabled();

  const handleUserUpdateSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (user && firstName && lastName && email) {
      update(authDispatch, {
        firstName,
        lastName,
        email,
      })
        .then(() =>
          enqueueSnackbar("User updated", {
            variant: "success",
          }),
        )
        .catch((err) =>
          enqueueSnackbar(err, {
            variant: "error",
          }),
        );
    }
  };

  const handlePasswordUpdateSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (user && password) {
      usersService
        .changePassword(password)
        .then(() => {
          setPassword("");
        })
        .then(() =>
          enqueueSnackbar("Password updated", {
            variant: "success",
          }),
        )
        .catch((err) =>
          enqueueSnackbar(err, {
            variant: "error",
          }),
        );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Profile"
        subtitle="Your details, password and the key your test runs use"
      />
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ValidatorForm onSubmit={handleUserUpdateSubmit} instantValidate>
                <Card variant="outlined">
                  <CardHeader
                    title="User details"
                    slotProps={{ title: { variant: "h6" } }}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <NameField
                          name="firstName"
                          label="First name"
                          value={firstName}
                          onChange={setFirstName}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <NameField
                          name="lastName"
                          label="Last name"
                          value={lastName}
                          onChange={setLastName}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextValidator
                          validators={["isEmail"]}
                          errorMessages={["Enter valid email address"]}
                          id="email"
                          name="email"
                          value={email}
                          label={"Email address"}
                          type="text"
                          variant="outlined"
                          required
                          fullWidth
                          // The identity provider owns the email of SSO users.
                          disabled={oidcEnabled !== false}
                          inputProps={{
                            onChange: (event: ChangeEvent<HTMLInputElement>) =>
                              setEmail(event.target.value),
                            "data-testid": "email",
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Select
                          variant="standard"
                          id="role"
                          labelId="role"
                          displayEmpty
                          fullWidth
                          disabled
                          value={user?.role}
                        >
                          {Object.entries(Role).map(([key, value]) => (
                            <MenuItem key={key} value={key}>
                              {value}
                            </MenuItem>
                          ))}
                        </Select>
                      </Grid>
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Grid container justifyContent="center">
                      <Grid item>
                        <Button
                          type="submit"
                          color="primary"
                          variant="contained"
                          data-testid="submit"
                        >
                          Update
                        </Button>
                      </Grid>
                    </Grid>
                  </CardActions>
                </Card>
              </ValidatorForm>
            </Grid>
            {oidcEnabled === false && (
              <Grid item xs={12}>
                <ValidatorForm
                  onSubmit={handlePasswordUpdateSubmit}
                  instantValidate
                >
                  <Card variant="outlined">
                    <CardHeader
                      title="Change password"
                      slotProps={{ title: { variant: "h6" } }}
                    />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <PasswordField
                            password={password}
                            setPassword={setPassword}
                            label={"New password"}
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
                            variant="contained"
                            data-testid="submit"
                          >
                            Update
                          </Button>
                        </Grid>
                      </Grid>
                    </CardActions>
                  </Card>
                </ValidatorForm>
              </Grid>
            )}
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardHeader
                  title="Api key"
                  slotProps={{ title: { variant: "h6" } }}
                />
                <CardContent>
                  <Typography
                    component="code"
                    sx={{
                      display: "block",
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      bgcolor: "action.hover",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {user?.apiKey}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <ConfigurationExamples />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
