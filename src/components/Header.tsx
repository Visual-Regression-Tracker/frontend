import React, { FunctionComponent } from "react";
import { AppBar, Toolbar, Typography, Grid, Button } from "@material-ui/core";
import { Link } from "react-router-dom";
import {
  useAuthState,
  useAuthDispatch,
  logout,
} from "../contexts/auth.context";

const Header: FunctionComponent = () => {
  const { loggedIn } = useAuthState();
  const dispatch = useAuthDispatch();

  const handleLogout = (event: React.MouseEvent) => {
    event.preventDefault();
    logout(dispatch);
  };

  return (
    <AppBar position="static" color="default">
      <Toolbar>
        <Grid container justify="space-between">
          <Grid item>
            <Grid container spacing={2}>
              <Grid item>
                <Link to="/">
                  <img src="/logo512.png" width="40" height="40" alt="logo" />
                </Link>
              </Grid>
              <Grid item>
                <Typography variant="h6" component={Link} to="/">
                  Project list
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            {loggedIn && (
              <Button data-testid="logoutBtn" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
