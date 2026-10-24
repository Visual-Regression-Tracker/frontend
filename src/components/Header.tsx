import React, { FunctionComponent } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Stack,
  ListSubheader,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useUserDispatch, useUserState, logout } from "../contexts";
import { routes } from "../constants";
import logo from "../static/logo.png";
import GuidedTour from "./GuidedTour";
import { Tooltip } from "./Tooltip";
import { ColorModeToggle } from "./ColorModeToggle";
import {
  HEADER_HELP_MENU_ID,
  HEADER_AVATAR_MENU_ID,
  HEADER_AVATAR_BUTTON_TEST_ID,
  HEADER_HELP_MENU_BUTTON_TEST_ID,
  HEADER_LOGOUT_BUTTON_TEST_ID,
} from "./Header.locators";
import {
  AllInbox,
  Face,
  GitHub,
  HelpOutline,
  People,
  Logout,
} from "@mui/icons-material";

const menuAnchor = {
  anchorOrigin: { vertical: "bottom", horizontal: "right" },
  transformOrigin: { vertical: "top", horizontal: "right" },
} as const;

const Header: FunctionComponent = () => {
  const [avatarMenuRef, setAvatarMenuRef] = React.useState<null | HTMLElement>(
    null,
  );

  const [helpMenuRef, setHelpMenuRef] = React.useState<null | HTMLElement>(
    null,
  );

  const { loggedIn, user } = useUserState();
  const authDispatch = useUserDispatch();

  const handleMenuClose = () => {
    setAvatarMenuRef(null);
    setHelpMenuRef(null);
  };

  const closeMenuAndOpenLink = () => {
    handleMenuClose();
    window.open(
      "https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker/issues/new",
      "_blank",
      // the opened page gets no handle on this tab (window.opener)
      "noopener,noreferrer",
    );
  };

  const getVRTVersion = (): string => {
    return window._env_.VRT_VERSION;
  };

  const renderHelpMenu = (
    <Menu
      {...menuAnchor}
      anchorEl={helpMenuRef}
      data-testid={HEADER_HELP_MENU_ID}
      keepMounted
      open={!!helpMenuRef}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>
        <GuidedTour />
      </MenuItem>
      <MenuItem onClick={closeMenuAndOpenLink}>
        <ListItemIcon>
          <GitHub fontSize="small" />
        </ListItemIcon>
        <ListItemText>Open an issue in GitHub</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem sx={{ justifyContent: "center" }} disabled>
        <Typography variant="caption">
          VRT Version : {getVRTVersion()}
        </Typography>
      </MenuItem>
    </Menu>
  );

  const renderAvatarMenu = (
    <Menu
      {...menuAnchor}
      anchorEl={avatarMenuRef}
      id={HEADER_AVATAR_MENU_ID}
      keepMounted
      open={!!avatarMenuRef}
      onClose={handleMenuClose}
      slotProps={{ paper: { sx: { minWidth: 200 } } }}
    >
      {/* a subheader, which the menu skips when it moves focus to an item */}
      {user && (
        <ListSubheader
          disableSticky
          sx={{ lineHeight: 1.4, py: 1, bgcolor: "transparent" }}
        >
          <Typography variant="subtitle2" color="text.primary" noWrap>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            component="div"
          >
            {user.email}
          </Typography>
        </ListSubheader>
      )}
      {user && <Divider />}
      {user?.role === "admin" && (
        <MenuItem
          component={Link}
          to={routes.USER_LIST_PAGE}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <People fontSize="small" />
          </ListItemIcon>
          <ListItemText>Users</ListItemText>
        </MenuItem>
      )}
      <MenuItem
        component={Link}
        to={routes.PROJECT_LIST_PAGE}
        onClick={handleMenuClose}
      >
        <ListItemIcon>
          <AllInbox fontSize="small" />
        </ListItemIcon>
        <ListItemText>Projects</ListItemText>
      </MenuItem>
      <MenuItem
        component={Link}
        to={routes.PROFILE_PAGE}
        onClick={handleMenuClose}
      >
        <ListItemIcon>
          <Face fontSize="small" />
        </ListItemIcon>
        <ListItemText>Profile</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem
        onClick={() => {
          handleMenuClose();
          logout(authDispatch);
        }}
        data-testid={HEADER_LOGOUT_BUTTON_TEST_ID}
      >
        <ListItemIcon>
          <Logout fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </Menu>
  );

  return (
    <React.Fragment>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1, minHeight: { xs: 64 } }}>
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              color: "text.primary",
              textDecoration: "none",
            }}
          >
            <img src={logo} width="44" height="44" alt="logo" />
            <Typography
              variant="subtitle1"
              component="span"
              sx={{ display: { xs: "none", sm: "inline" }, fontWeight: 700 }}
            >
              Visual Regression Tracker
            </Typography>
          </Box>
          <Box flex={1} />
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <ColorModeToggle />
            <Tooltip title="Help">
              <IconButton
                onClick={(event: React.MouseEvent<HTMLElement>) =>
                  setHelpMenuRef(event.currentTarget)
                }
                data-testid={HEADER_HELP_MENU_BUTTON_TEST_ID}
              >
                <HelpOutline />
              </IconButton>
            </Tooltip>
            {loggedIn && (
              <IconButton
                onClick={(event: React.MouseEvent<HTMLElement>) =>
                  setAvatarMenuRef(event.currentTarget)
                }
                data-testid={HEADER_AVATAR_BUTTON_TEST_ID}
                sx={{ p: 0.5 }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  }}
                >{`${user?.firstName[0]}${user?.lastName[0]}`}</Avatar>
              </IconButton>
            )}
          </Stack>
        </Toolbar>
      </AppBar>
      {renderAvatarMenu}
      {renderHelpMenu}
    </React.Fragment>
  );
};

export default Header;
