import { useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  CardHeader,
  Chip,
  Container,
  Stack,
} from "@mui/material";
import { PageHeader } from "../components/PageHeader";
import { useUserDispatch, useUserState, update } from "../contexts";
import { usersService } from "../services";
import { useSnackbar } from "notistack";
import { ApiKeyCard } from "../components/ApiKeyCard";
import { ConfigurationExamples } from "../components/ConfigurationExamples";
import { ValidatedForm } from "../components/ValidatedForm";
import { Role } from "../types";
import PasswordField from "../components/PasswordField";
import NameField from "../components/NameField";
import EmailField from "../components/EmailField";
import { useOidcEnabled } from "../_helpers/useOidcEnabled";

const cardActionsSx = { justifyContent: "flex-end" } as const;

const ProfilePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useUserState();
  const authDispatch = useUserDispatch();
  const [email, setEmail] = useState(user?.email);
  const [firstName, setFirstName] = useState(user?.firstName);
  const [lastName, setLastName] = useState(user?.lastName);
  const [password, setPassword] = useState("");
  const oidcEnabled = useOidcEnabled();

  const handleUserUpdateSubmit = () => {
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
        .catch((err: string) =>
          enqueueSnackbar(err, {
            variant: "error",
          }),
        );
    }
  };

  const handlePasswordUpdateSubmit = () => {
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
        .catch((err: string) =>
          enqueueSnackbar(err, {
            variant: "error",
          }),
        );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader title="Profile" />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2}>
            <ValidatedForm onSubmit={handleUserUpdateSubmit}>
              <Card variant="outlined">
                <CardHeader
                  title="Your details"
                  slotProps={{ title: { variant: "h6" } }}
                />
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2}>
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
                    <EmailField
                      value={email}
                      onChange={setEmail}
                      disabled={oidcEnabled !== false}
                      helperText={
                        oidcEnabled === true
                          ? "Locked when you sign in with SSO"
                          : undefined
                      }
                    />
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      <Typography variant="body2">Role</Typography>
                      <Chip
                        size="small"
                        label={user ? Role[user.role] : ""}
                        data-testid="role"
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        changed by an admin on Users
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
                <CardActions sx={cardActionsSx}>
                  <Button
                    type="submit"
                    color="primary"
                    variant="contained"
                    data-testid="submit"
                  >
                    Update
                  </Button>
                </CardActions>
              </Card>
            </ValidatedForm>
            {oidcEnabled === false && (
              <ValidatedForm onSubmit={handlePasswordUpdateSubmit}>
                <Card variant="outlined">
                  <CardHeader
                    title="Password"
                    slotProps={{ title: { variant: "h6" } }}
                  />
                  <CardContent>
                    <PasswordField
                      password={password}
                      setPassword={setPassword}
                      label="New password"
                    />
                  </CardContent>
                  <CardActions sx={cardActionsSx}>
                    <Button
                      type="submit"
                      color="primary"
                      variant="contained"
                      data-testid="submit"
                    >
                      Update password
                    </Button>
                  </CardActions>
                </Card>
              </ValidatedForm>
            )}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2}>
            <ApiKeyCard />
            <ConfigurationExamples />
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
