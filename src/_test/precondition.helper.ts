import { User } from "../types";

const haveUserLogged = (user: User) =>
  localStorage.setItem("user", JSON.stringify(user));

const haveWindowsEnvSet = (env: { REACT_APP_API_URL: string }) => {
  window._env_ = {
    REACT_APP_API_URL: env.REACT_APP_API_URL,
  };
};

export { haveUserLogged, haveWindowsEnvSet };
