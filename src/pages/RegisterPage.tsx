import React, { useEffect } from "react";
import { Grid } from "@material-ui/core";
import RegisterForm from "../components/RegisterForm";
import { useHistory } from "react-router-dom";
import { useAuthState } from "../contexts/auth.context";
import { routes } from "../constants";

const RegisterPage = () => {
  const history = useHistory();
  const { loggedIn } = useAuthState();

  useEffect(() => {
    if (loggedIn) history.replace(routes.PROJECTS_PAGE);
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
        <RegisterForm />
      </Grid>
    </Grid>
  );
};

export default RegisterPage;
