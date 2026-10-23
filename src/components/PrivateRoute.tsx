import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserState } from "../contexts";
import { routes } from "../constants";
import { User } from "../types";

interface PropType {
  component: React.FC;
  roles?: User["role"][];
}

const PrivateRoute: React.FunctionComponent<PropType> = ({
  component: Component,
  roles,
}) => {
  const { loggedIn, user } = useUserState();
  const location = useLocation();

  if (!loggedIn) {
    return <Navigate to={routes.LOGIN} state={{ from: location.pathname }} />;
  }

  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to={routes.PROJECT_LIST_PAGE} />;
  }

  return <Component />;
};

export default PrivateRoute;
