import React, { useEffect } from "react";
import { Grid } from "@material-ui/core";
import RegisterForm from "../components/RegisterForm";
import { useHistory } from "react-router-dom";
import { useUserState } from "../contexts";
import { routes } from "../constants";

const RegisterPage = () => {
  const history = useHistory();
  const { loggedIn } = useUserState();

  useEffect(() => {
    if (loggedIn) history.replace(routes.HOME);
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
        <RegisterForm />
      </Grid>
    </Grid>
  );
};

export default RegisterPage;
