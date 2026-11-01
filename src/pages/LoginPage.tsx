import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import LoginForm from "../components/LoginForm";
import { AuthLayout } from "../components/AuthLayout";
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

  // the token arrives in the url fragment, so it never reaches server logs
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    const error = params.get("error");

    if (!token && !error) {
      return;
    }

    // drop the fragment so the token stays out of history
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
    <AuthLayout
      title="Sign in"
      subtitle="Review screenshots and keep your baselines up to date."
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
