import React from "react";
import { Redirect, Route, RouteProps } from "react-router-dom";
import { useAuthState } from "../contexts";
import { routes } from "../constants";

const PrivateRoute: React.FunctionComponent<RouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { loggedIn } = useAuthState();
  if (!Component) {
    return null;
  }
  return (
    <Route
      {...rest}
      render={(props) =>
        loggedIn ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{ pathname: routes.LOGIN, state: { from: props.location } }}
          />
        )
      }
    />
  );
};

export default PrivateRoute;
