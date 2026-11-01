import type { ComponentType } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserState } from "../contexts";
import { routes } from "../constants";
import { User } from "../types";

interface PropType {
  component: ComponentType;
  roles?: User["role"][];
}

const PrivateRoute = ({ component: Component, roles }: PropType) => {
  const { loggedIn, user } = useUserState();
  const location = useLocation();

  if (!loggedIn) {
    const from = location.pathname + location.search + location.hash;
    return <Navigate to={routes.LOGIN} state={{ from }} />;
  }

  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to={routes.PROJECT_LIST_PAGE} />;
  }

  return <Component />;
};

export default PrivateRoute;
