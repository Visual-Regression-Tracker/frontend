import React, { useEffect } from "react";
import { Grid } from "@mui/material";
import LoginForm from "../components/LoginForm";
import { setHelpSteps, useHelpDispatch } from "../contexts";
import { LOGIN_PAGE_STEPS } from "../constants";

const LoginPage = () => {
  const helpDispatch = useHelpDispatch();

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
