import React, { FunctionComponent } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
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

const Header: FunctionComponent = () => {
  const [menuRef, setMenuRef] = React.useState<null | HTMLElement>(null);
  const { loggedIn, user } = useAuthState();
  const dispatch = useAuthDispatch();

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
      <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
      <MenuItem
        onClick={() => {
          handleMenuClose();
          logout(dispatch);
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
