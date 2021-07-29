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
  Select,
  MenuItem,
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
import { TextValidator, ValidatorForm } from "react-material-ui-form-validator";
import { Role } from "../types";

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

  const errorForTwoChar = "Enter at least two characters.";

  return (
    <Box m={2}>
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <ValidatorForm onSubmit={handleUserUpdateSubmit} instantValidate>
                <Card variant="outlined">
                  <CardHeader title={"User details"} />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
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
                              setFirstName(
                                (event.target as HTMLInputElement).value
                              ),
                            "data-testid": "firstName",
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
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
                              setLastName(
                                (event.target as HTMLInputElement).value
                              ),
                            "data-testid": "lastName",
                          }}
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
                          inputProps={{
                            onChange: (event: any) =>
                              setEmail(
                                (event.target as HTMLInputElement).value
                              ),
                            "data-testid": "email",
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Select
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
              </ValidatorForm>
            </Grid>
            <Grid item xs={12}>
              <ValidatorForm
                onSubmit={handlePasswordUpdateSubmit}
                instantValidate
              >
                <Card variant="outlined">
                  <CardHeader title="Change password" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextValidator
                          validators={["minStringLength:2"]}
                          errorMessages={[errorForTwoChar]}
                          id="password"
                          name="password"
                          value={password}
                          label={"New password"}
                          type="password"
                          variant="outlined"
                          required
                          fullWidth
                          inputProps={{
                            onChange: (event: any) =>
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
              </ValidatorForm>
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
