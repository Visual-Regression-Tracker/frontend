import React from "react";
import { Redirect, Route, RouteProps } from "react-router-dom";
import { useAuthState } from "../contexts/auth.context";

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
                            to={{ pathname: "/login", state: { from: props.location } }}
                        />
                    )
            }
        />
    );
};

export default PrivateRoute;
