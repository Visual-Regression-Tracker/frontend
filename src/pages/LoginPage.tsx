import React, { useEffect } from "react";
import { Grid } from "@material-ui/core";
import LoginForm from "../components/LoginForm";
import { useHistory } from "react-router-dom";
import { useAuthState } from "../contexts/auth.context";

const LoginPage = () => {
    const history = useHistory();
    const { loggedIn } = useAuthState();

    useEffect(() => {
        if (loggedIn) history.push('/')
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
