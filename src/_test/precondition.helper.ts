import { User } from "../types";

const haveUserLogged = (user: User) =>
  localStorage.setItem("user", JSON.stringify(user));

const haveWindowsEnvSet = (env: {
  REACT_APP_API_URL: string;
  VRT_VERSION: string;
}) => {
  window._env_ = {
    REACT_APP_API_URL: env.REACT_APP_API_URL,
    VRT_VERSION: env.VRT_VERSION,
  };
};

export { haveUserLogged, haveWindowsEnvSet };
