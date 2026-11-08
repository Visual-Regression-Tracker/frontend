import { Fragment, type MouseEvent, useState } from "react";
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
import { Link, useLocation } from "react-router-dom";
import { useUserDispatch, useUserState, logout } from "../contexts";
import { routes } from "../constants";
import logo from "../static/logo.png";
import { ColorModeToggle } from "./ColorModeToggle";
import { ProjectBreadcrumb } from "./ProjectBreadcrumb";
import { ProjectTabs } from "./ProjectTabs";
import { matchShellRoute } from "../_helpers/route.helpers";
import {
  HEADER_AVATAR_MENU_ID,
  HEADER_AVATAR_BUTTON_TEST_ID,
  HEADER_LOGOUT_BUTTON_TEST_ID,
} from "./Header.locators";
import { AllInbox, Face, People, Logout } from "@mui/icons-material";

const menuAnchor = {
  anchorOrigin: { vertical: "bottom", horizontal: "right" },
  transformOrigin: { vertical: "top", horizontal: "right" },
} as const;

const Header = () => {
  const [avatarMenuRef, setAvatarMenuRef] = useState<null | HTMLElement>(null);

  const { loggedIn, user } = useUserState();
  const authDispatch = useUserDispatch();
  const { pathname } = useLocation();
  const shellRoute = loggedIn ? matchShellRoute(pathname) : undefined;

  const handleMenuClose = () => {
    setAvatarMenuRef(null);
  };

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
          <Typography variant="subtitle2" noWrap sx={{ color: "text.primary" }}>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            component="div"
            sx={{ color: "text.secondary" }}
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
    <Fragment>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56 } }}>
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
            <img src={logo} width="36" height="36" alt="logo" />
            <Typography
              variant="subtitle1"
              component="span"
              sx={{ fontWeight: 700 }}
            >
              VRT
            </Typography>
          </Box>
          {shellRoute && (
            <Box sx={{ ml: 1, minWidth: 0, display: "flex" }}>
              <ProjectBreadcrumb route={shellRoute} />
            </Box>
          )}
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <ColorModeToggle />
            {loggedIn && (
              <IconButton
                onClick={(event: MouseEvent<HTMLElement>) =>
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
                >{`${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`}</Avatar>
              </IconButton>
            )}
          </Stack>
        </Toolbar>
      </AppBar>
      {shellRoute && <ProjectTabs route={shellRoute} />}
      {renderAvatarMenu}
    </Fragment>
  );
};

export default Header;
