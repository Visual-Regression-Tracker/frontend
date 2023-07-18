import React from "react";
import { Grid } from "@mui/material";
import RegisterForm from "../components/RegisterForm";

const RegisterPage = () => (
  <Grid
    container
    spacing={0}
    direction="column"
    alignItems="center"
    justifyContent="center"
    style={{
      minHeight: "60vh",
    }}
  >
    <Grid item>
      <RegisterForm />
    </Grid>
  </Grid>
);

export default RegisterPage;
