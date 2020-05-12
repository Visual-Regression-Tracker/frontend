import React, { FunctionComponent } from "react";
import {
  AppBar,
  Toolbar,
  Grid,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import {
  useAuthState,
  useAuthDispatch,
  logout,
} from "../contexts/auth.context";
import { routes } from "../constants";

const Header: FunctionComponent = () => {
  const [menuRef, setMenuRef] = React.useState<null | HTMLElement>(null);
  const { loggedIn, user } = useAuthState();
  const authDispatch = useAuthDispatch();

  const handleMenuClose = () => {
    setMenuRef(null);
  };

  const renderMenu = (
    <Menu
      anchorEl={menuRef}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      id="headerMenu"
      keepMounted
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      open={!!menuRef}
      onClose={handleMenuClose}
    >
      <MenuItem
        component={Link}
        to={routes.PROJECT_LIST_PAGE}
        onClick={handleMenuClose}
      >
        Projects
      </MenuItem>
      <MenuItem
        component={Link}
        to={routes.PROFILE_PAGE}
        onClick={handleMenuClose}
      >
        Profile
      </MenuItem>
      <MenuItem
        onClick={() => {
          handleMenuClose();
          logout(authDispatch);
        }}
        data-testid="logoutBtn"
      >
        Logout
      </MenuItem>
    </Menu>
  );

  return (
    <React.Fragment>
      <AppBar position="static" color="default">
        <Toolbar>
          <Grid container justify="space-between">
            <Grid item>
              <Grid container>
                <Grid item>
                  <Link to="/">
                    <img src="/logo512.png" width="40" height="40" alt="logo" />
                  </Link>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              {loggedIn && (
                <IconButton
                  onClick={(event: React.MouseEvent<HTMLElement>) =>
                    setMenuRef(event.currentTarget)
                  }
                >
                  <Avatar>{`${user?.firstName[0]}${user?.lastName[0]}`}</Avatar>
                </IconButton>
              )}
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      {renderMenu}
    </React.Fragment>
  );
};

export default Header;
