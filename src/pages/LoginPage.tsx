import React, { useEffect } from "react";
import { Grid } from "@material-ui/core";
import LoginForm from "../components/LoginForm";
import { useHistory, useLocation } from "react-router-dom";
import { setHelpSteps, useHelpDispatch, useUserState } from "../contexts";
import { LOGIN_PAGE_STEPS, routes } from "../constants";

const LoginPage = () => {
  const history = useHistory();
  const location = useLocation<{ from: string }>();
  const { loggedIn } = useUserState();
  const helpDispatch = useHelpDispatch();

  const { from } = location.state || {
    from: { pathname: routes.HOME },
  };

  useEffect(() => {
    if (loggedIn) history.replace(from);
  });

  useEffect(() => {
    setHelpSteps(helpDispatch, LOGIN_PAGE_STEPS);
  });

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: "60vh" }}
    >
      <Grid item>
        <LoginForm />
      </Grid>
    </Grid>
  );
};

export default LoginPage;
