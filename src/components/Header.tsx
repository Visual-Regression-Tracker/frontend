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
import { useAuthState, useAuthDispatch, logout } from "../contexts";
import { routes } from "../constants";
import logo from "../static/logo.png";

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
        to={routes.USER_LIST_PAGE}
        onClick={handleMenuClose}
      >
        Users
      </MenuItem>
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
          <Grid container justify="space-between" alignItems="center">
            <Grid item>
              <Link to="/">
                <img src={logo} width="60" height="60" alt="logo" />
              </Link>
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
