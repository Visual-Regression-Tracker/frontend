import React, { useState, FormEvent } from "react";
import {
  Grid,
  Card,
  CardContent,
  TextField,
  CardActions,
  Button,
  Typography,
} from "@material-ui/core";
import {
  useAuthState,
  useAuthDispatch,
  update,
} from "../contexts";
import { usersService } from "../services";

const ProfilePage = () => {
  const { user } = useAuthState();
  const dispatch = useAuthDispatch();
  const [email, setEmail] = useState(user?.email);
  const [firstName, setFirstName] = useState(user?.firstName);
  const [lastName, setLastName] = useState(user?.lastName);
  const [password, setPassword] = useState("");

  const handleUserUpdateSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (user && firstName && lastName && email) {
      usersService
        .update({
          id: user.id,
          firstName,
          lastName,
          email,
        })
        .then((user) => update(dispatch, user));
    }
  };

  const handlePasswordUpdateSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (user && password) {
      usersService.changePassword(password).then((isChanged) => {
        setPassword("");
      });
    }
  };

  return (
    <Grid
      container
      spacing={4}
      direction="column"
      alignItems="center"
      justify="center"
      style={{ minHeight: "60vh" }}
    >
      <Grid item>
        <Card variant="outlined">
          <CardContent>
            <Typography>apiKey: {user?.apiKey}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item>
        <form onSubmit={handleUserUpdateSubmit}>
          <Card variant="outlined">
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
                        setFirstName((event.target as HTMLInputElement).value),
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
                        setLastName((event.target as HTMLInputElement).value),
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
      <Grid item>
        <form onSubmit={handlePasswordUpdateSubmit}>
          <Card variant="outlined">
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
                        setPassword((event.target as HTMLInputElement).value),
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
  );
};

export default ProfilePage;
