import React, { useEffect } from "react";
import { Grid } from "@material-ui/core";
import LoginForm from "../components/LoginForm";
import { useHistory, useLocation } from "react-router-dom";
import { useAuthState } from "../contexts";
import { routes } from "../constants";

const LoginPage = () => {
  const history = useHistory();
  const location = useLocation<{ from: string }>();
  const { loggedIn } = useAuthState();
  const { from } = location.state || {
    from: { pathname: routes.HOME },
  };

  useEffect(() => {
    if (loggedIn) history.replace(from);
  });

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justify="center"
      style={{ minHeight: "60vh" }}
    >
      <Grid item>
        <LoginForm />
      </Grid>
    </Grid>
  );
};

export default LoginPage;
