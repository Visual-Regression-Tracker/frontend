import React, { useEffect } from "react";
import { Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import LoginForm from "../components/LoginForm";
import { setHelpSteps, useHelpDispatch, useUserDispatch } from "../contexts";
import { LOGIN_PAGE_STEPS, routes } from "../constants";
import { usersService } from "../services";

const LoginPage = () => {
  const helpDispatch = useHelpDispatch();
  const userDispatch = useUserDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setHelpSteps(helpDispatch, LOGIN_PAGE_STEPS);
  });

  // Handle the redirect back from the OIDC provider. The token arrives in the
  // url fragment (see backend buildFrontendRedirect), so it never reaches the
  // server logs.
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    const error = params.get("error");

    if (!token && !error) {
      return;
    }

    // Drop the fragment so the token is not kept in history or bookmarked.
    window.history.replaceState(null, "", window.location.pathname);

    if (token) {
      usersService
        .completeOidcLogin(token)
        .then((user) => {
          userDispatch({ type: "success", payload: user });
          navigate(routes.HOME);
        })
        .catch((err) => enqueueSnackbar(err, { variant: "error" }));
    } else {
      enqueueSnackbar("SSO login failed.", { variant: "error" });
    }
  }, [enqueueSnackbar, navigate, userDispatch]);

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
