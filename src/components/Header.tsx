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
import Joyride, { CallBackProps, STATUS, StoreHelpers } from 'react-joyride';
import { HelpOutline } from "@material-ui/icons";

const Header: FunctionComponent = (props: any) => {
  const [menuRef, setMenuRef] = React.useState<null | HTMLElement>(null);
  const [run, setRun] = React.useState(false);
  const { loggedIn, user } = useAuthState();
  const authDispatch = useAuthDispatch();
  let helpers: StoreHelpers;

  const getHelpers = (helper: StoreHelpers) => {
    helpers = helper;
  };

  const handleMenuClose = () => {
    setMenuRef(null);
  };

  const handleClickStart = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setRun(true);
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
    }
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
      {user?.role === Role.admin && (
        <MenuItem
          component={Link}
          to={routes.USER_LIST_PAGE}
          onClick={handleMenuClose}
        >
          Users
        </MenuItem>
      )}
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
              <Grid container justify="space-between" alignItems="center">
                <IconButton
                  onClick={handleClickStart}
                >
                  <Avatar>
                    <HelpOutline />
                    <Joyride
                      callback={handleJoyrideCallback}
                      continuous={true}
                      getHelpers={getHelpers}
                      run={run}
                      scrollToFirstStep={true}
                      showProgress={true}
                      showSkipButton={true}
                      steps={props.getHelpSteps()}
                      styles={{
                        options: {
                          zIndex: 10000,
                        },
                      }}
                    />
                  </Avatar>
                </IconButton>
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
          </Grid>
        </Toolbar>
      </AppBar>
      {renderMenu}
    </React.Fragment>
  );
};

export default Header;
