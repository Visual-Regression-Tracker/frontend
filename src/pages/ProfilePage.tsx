import React, { useState, FormEvent } from "react";
import {
  Grid,
  Card,
  CardContent,
  TextField,
  CardActions,
  Button,
  Typography,
  Box,
  CardHeader,
  Tabs,
  Tab,
} from "@material-ui/core";
import { useAuthState, useAuthDispatch, update } from "../contexts";
import { usersService } from "../services";
import { useSnackbar } from "notistack";

const ProfilePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthState();
  const dispatch = useAuthDispatch();
  const [email, setEmail] = useState(user?.email);
  const [firstName, setFirstName] = useState(user?.firstName);
  const [lastName, setLastName] = useState(user?.lastName);
  const [password, setPassword] = useState("");
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleUserUpdateSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (user && firstName && lastName && email) {
      update(dispatch, {
        firstName,
        lastName,
        email,
      })
        .then(() =>
          enqueueSnackbar("User updated", {
            variant: "success",
          })
        )
        .catch((err) =>
          enqueueSnackbar(err, {
            variant: "error",
          })
        );
    }
  };

  const handlePasswordUpdateSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (user && password) {
      usersService
        .changePassword(password)
        .then((isChanged) => {
          setPassword("");
        })
        .then(() =>
          enqueueSnackbar("Password updated", {
            variant: "success",
          })
        )
        .catch((err) =>
          enqueueSnackbar(err, {
            variant: "error",
          })
        );
    }
  };

  return (
    <Grid container>
      <Grid item xs={6}>
        <Grid container>
          <Grid item xs={12}>
            <form onSubmit={handleUserUpdateSubmit}>
              <Card variant="outlined">
                <CardHeader title={"User details"} />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
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
                            setFirstName(
                              (event.target as HTMLInputElement).value
                            ),
                          "data-testid": "firstName",
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
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
                            setLastName(
                              (event.target as HTMLInputElement).value
                            ),
                          "data-testid": "lastName",
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
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
                        Update
                      </Button>
                    </Grid>
                  </Grid>
                </CardActions>
              </Card>
            </form>
          </Grid>
          <Grid item xs={12}>
            <form onSubmit={handlePasswordUpdateSubmit}>
              <Card variant="outlined">
                <CardHeader title="Change password" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        id="password"
                        name="password"
                        value={password}
                        label={"New password"}
                        type="password"
                        variant="outlined"
                        required
                        fullWidth
                        inputProps={{
                          onChange: (event) =>
                            setPassword(
                              (event.target as HTMLInputElement).value
                            ),
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
                        Update
                      </Button>
                    </Grid>
                  </Grid>
                </CardActions>
              </Card>
            </form>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={6}>
        <Grid container>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader title={"Api key"} />
              <CardContent>
                <Typography>{user?.apiKey}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader title={"Configuration examples"} />
              <CardContent>
                <Tabs
                  value={tabIndex}
                  indicatorColor="primary"
                  textColor="primary"
                  onChange={(
                    event: React.ChangeEvent<{}>,
                    newValue: number
                  ) => {
                    setTabIndex(newValue);
                  }}
                >
                  <Tab label="Config file" />
                  <Tab label="Environment variables" />
                </Tabs>
                <div role="tabpanel" hidden={tabIndex !== 0}>
                  {tabIndex === 0 && (
                    <Box p={3}>
                      <Typography>Copy and save it as vrt.json</Typography>
                      <TextField
                        id="configFile"
                        name="configFile"
                        variant="outlined"
                        disabled
                        value={`{
  "apiUrl": "${window._env_.REACT_APP_API_URL}",
  "apiKey": "${user?.apiKey}",
  "project": "project",
  "branchName": "master",
  "ciBuildId": "config_file",
  "enableSoftAssert": false
}`}
                        multiline
                        rows={8}
                        fullWidth
                      />
                    </Box>
                  )}
                </div>
                <div role="tabpanel" hidden={tabIndex !== 1}>
                  {tabIndex === 1 && (
                    <Box p={3}>
                      <Typography>Some config2</Typography>
                    </Box>
                  )}
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ProfilePage;
