import React from "react";
import { Grid } from "@material-ui/core";
import RegisterForm from "../components/RegisterForm";

const RegisterPage = () => {

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
