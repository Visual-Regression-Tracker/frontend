import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserState } from "../contexts";
import { routes } from "../constants";

interface PropType {
  component: React.FC;
}

const PrivateRoute: React.FunctionComponent<PropType> = ({
  component: Component,
}) => {
  const { loggedIn } = useUserState();
  const location = useLocation()

  if (loggedIn) return <Component />;

  return <Navigate to={routes.LOGIN} state={{ from: location.pathname }} />;
};

export default PrivateRoute;
