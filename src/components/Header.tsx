import React, { FunctionComponent } from "react";
import {
  AppBar,
  Toolbar,
  Grid,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useUserDispatch, useUserState, logout } from "../contexts";
import { routes } from "../constants";
import logo from "../static/logo.png";
import GuidedTour from "./GuidedTour";
import {
  AllInbox,
  Face,
  GitHub,
  HelpOutline,
  People,
  SettingsPower,
} from "@mui/icons-material";

const Header: FunctionComponent = () => {
  const [avatarMenuRef, setAvatarMenuRef] = React.useState<null | HTMLElement>(
    null,
  );

  const [helpMenuRef, setHelpMenuRef] = React.useState<null | HTMLElement>(
    null,
  );

  const { loggedIn, user } = useUserState();
  const authDispatch = useUserDispatch();

  const styleMenuItem = {
    display: "flex",
    alignItems: "center",
  };

  const handleMenuClose = () => {
    setAvatarMenuRef(null);
    setHelpMenuRef(null);
  };

  const closeMenuAndOpenLink = () => {
    handleMenuClose();
    window.open(
      "https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker/issues/new",
      "_blank",
    );
  };

  const getVRTVersion = (): string => {
    return window._env_.VRT_VERSION;
  };

  const renderHelpMenu = (
    <Menu
      anchorEl={helpMenuRef}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id="headerHelpMenu"
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={!!helpMenuRef}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>
        <GuidedTour />
      </MenuItem>
      <MenuItem onClick={closeMenuAndOpenLink} style={styleMenuItem}>
        <IconButton size="small">
          <GitHub />
        </IconButton>
        Open an issue in GitHub
      </MenuItem>
      <hr />
      <MenuItem
        style={{
          justifyContent: "center",
        }}
        disabled
      >
        VRT Version : {getVRTVersion()}
      </MenuItem>
    </Menu>
  );

  const renderAvatarMenu = (
    <Menu
      anchorEl={avatarMenuRef}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id="headerAvatarMenu"
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={!!avatarMenuRef}
      onClose={handleMenuClose}
    >
      {user?.role === "admin" && (
        <MenuItem
          component={Link}
          to={routes.USER_LIST_PAGE}
          onClick={handleMenuClose}
          style={styleMenuItem}
        >
          <IconButton size="small">
            <People />
          </IconButton>
          Users
        </MenuItem>
      )}
      <MenuItem
        component={Link}
        to={routes.PROJECT_LIST_PAGE}
        onClick={handleMenuClose}
        style={styleMenuItem}
      >
        <IconButton size="small">
          <AllInbox />
        </IconButton>
        Projects
      </MenuItem>
      <MenuItem
        component={Link}
        to={routes.PROFILE_PAGE}
        onClick={handleMenuClose}
        style={styleMenuItem}
      >
        <IconButton size="small">
          <Face />
        </IconButton>
        Profile
      </MenuItem>
      <MenuItem
        onClick={() => {
          handleMenuClose();
          logout(authDispatch);
        }}
        data-testId="logoutBtn"
      >
        <IconButton size="small">
          <SettingsPower />
        </IconButton>
        Logout
      </MenuItem>
    </Menu>
  );

  return (
    <React.Fragment>
      <AppBar position="static" color="default">
        <Toolbar>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Link to="/">
                <img src={logo} width="60" height="60" alt="logo" />
              </Link>
            </Grid>
            <Grid item>
              <Grid
                container
                justifyContent="space-between"
                alignItems="center"
              >
                <IconButton
                  onClick={(event: React.MouseEvent<HTMLElement>) =>
                    setHelpMenuRef(event.currentTarget)
                  }
                  size="large"
                  color="secondary"
                >
                  <Avatar>
                    <HelpOutline />
                  </Avatar>
                </IconButton>
                {loggedIn && (
                  <IconButton
                    onClick={(event: React.MouseEvent<HTMLElement>) =>
                      setAvatarMenuRef(event.currentTarget)
                    }
                    size="large"
                    color="secondary"
                  >
                    <Avatar>{`${user?.firstName[0]}${user?.lastName[0]}`}</Avatar>
                  </IconButton>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      {renderAvatarMenu}
      {renderHelpMenu}
    </React.Fragment>
  );
};

export default Header;
