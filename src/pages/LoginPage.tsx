import React, { useEffect } from "react";
import { Grid } from "@material-ui/core";
import LoginForm from "../components/LoginForm";
import { useHistory, useLocation } from "react-router-dom";
import { useAuthState } from "../contexts";
import { routes } from "../constants";

const LoginPage = (props: any) => {
  const history = useHistory();
  const location = useLocation<{ from: string }>();
  const { loggedIn } = useAuthState();
  const { from } = location.state || {
    from: { pathname: routes.HOME },
  };

  const helpSteps = [{
    target: "#loginform-1",
    content: "Get default username and password from the docker run log.",
  }];

  useEffect(() => {
    if (loggedIn) history.replace(from);
    props.populateHelpSteps(helpSteps);
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
      <Grid item id="loginform-1" >
        <LoginForm />
      </Grid>
    </Grid>
  );
};

export default LoginPage;
