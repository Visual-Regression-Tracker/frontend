import React from "react";
import { Grid } from "@material-ui/core";
import LoginForm from "../components/LoginForm";

const LoginPage = () => {
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
