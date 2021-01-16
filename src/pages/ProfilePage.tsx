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
import {
  useAuthState,
  useAuthDispatch,
  update,
  selectProject,
  useProjectDispatch,
  useProjectState,
} from "../contexts";
import { usersService } from "../services";
import { useSnackbar } from "notistack";
import ProjectSelect from "../components/ProjectSelect";

const ProfilePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthState();
  const authDispatch = useAuthDispatch();
  const projectDispatch = useProjectDispatch();
  const { selectedProjectId } = useProjectState();
  const [email, setEmail] = useState(user?.email);
  const [firstName, setFirstName] = useState(user?.firstName);
  const [lastName, setLastName] = useState(user?.lastName);
  const [password, setPassword] = useState("");
  const [tabIndex, setTabIndex] = React.useState(0);

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

  const isTextboxFirstNameValid = (firstName || "").length > 1;
  const isTextboxLastNameValid = (lastName || "").length > 1;
  const isEmailLengthCorrect = (email || "").length > 4;
  const isEmailFormatCorrect =  (email || "").includes(".") && (email || "").includes("@");
  const isEmailValid = isEmailFormatCorrect && isEmailLengthCorrect;
  const isPasswordValid = password.length > 3;
  const isUserDetailsValid = isTextboxFirstNameValid && isTextboxLastNameValid && isEmailFormatCorrect && isEmailValid;

  return (
    <Box m={2}>
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Grid container spacing={1}>
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
                          error={!isTextboxFirstNameValid}
                          helperText={
                            !isTextboxFirstNameValid
                              ? "Enter at least 2 character."
                              : ""
                          }
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
                          error={!isTextboxLastNameValid}
                          helperText={
                            !isTextboxLastNameValid
                              ? "Enter at least 2 character."
                              : ""
                          }
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
                          error={!isEmailValid}
                          helperText={
                            !isEmailFormatCorrect
                              ? "Enter valid email address."
                              : !isEmailLengthCorrect
                              ? "Email length should be at least 5."
                              : ""
                          }
                          inputProps={{
                            onChange: (event) =>
                              setEmail(
                                (event.target as HTMLInputElement).value
                              ),
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
                          disabled={!isUserDetailsValid}
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
                          disabled={!isPasswordValid}
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
          <Grid container spacing={1}>
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
                  <ProjectSelect
                    onProjectSelect={(id) => selectProject(projectDispatch, id)}
                  />
                  <Tabs
                    variant="fullWidth"
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
                    <Tab label="ENV variables" />
                  </Tabs>
                  <div role="tabpanel" hidden={tabIndex !== 0}>
                    {tabIndex === 0 && (
                      <Box p={3}>
                        <TextField
                          id="configFile"
                          name="configFile"
                          variant="outlined"
                          disabled
                          value={`{
    "apiUrl": "${window._env_.REACT_APP_API_URL}",
    "apiKey": "${user?.apiKey}",
    "project": "${selectedProjectId ?? "Default project"}",
    "branchName": "master",
    "ciBuildId": "commit_sha",
    "enableSoftAssert": false
}`}
                          multiline
                          rows={8}
                          fullWidth
                          helperText="Save as vrt.json in project root. Could be overridden with ENV variables"
                        />
                      </Box>
                    )}
                  </div>
                  <div role="tabpanel" hidden={tabIndex !== 1}>
                    {tabIndex === 1 && (
                      <Box p={3}>
                        <TextField
                          id="envVariables"
                          name="envVariables"
                          variant="outlined"
                          disabled
                          value={`
  VRT_APIURL="${window._env_.REACT_APP_API_URL}"
  VRT_APIKEY="${user?.apiKey}"
  VRT_PROJECT="${selectedProjectId ?? "Default project"} "
  VRT_BRANCHNAME="master"
  VRT_CIBUILDID="commit_sha"
  VRT_ENABLESOFTASSERT=false
  `}
                          multiline
                          rows={8}
                          fullWidth
                          helperText="Add Environment variables inside CI environment"
                        />
                      </Box>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
