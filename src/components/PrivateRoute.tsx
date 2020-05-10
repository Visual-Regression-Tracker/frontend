import React from "react";
import { Redirect, Route, RouteProps } from "react-router-dom";
import { useAuthState } from "../contexts/auth.context";
import { routes } from "../constants";

const PrivateRoute: React.SFC<RouteProps> = ({
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
