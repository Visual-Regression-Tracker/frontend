import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProjectsListPage from "./pages/ProjectListPage";
import ProjectPage from "./pages/ProjectPage";
import PrivateRoute from "./components/PrivateRoute";
import { routes } from "./constants";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import TestVariationPage from "./pages/TestVariationPage";

function Router() {
  return (
    <Switch>
      <Route exact path={routes.LOGIN} component={() => <LoginPage />} />
      <Route exact path={routes.REGISTER} component={() => <RegisterPage />} />
      <PrivateRoute
        exact
        path={routes.PROFILE_PAGE}
        component={() => <ProfilePage />}
      />
      <PrivateRoute
        exact
        path={routes.PROJECT_LIST_PAGE}
        component={() => <ProjectsListPage />}
      />
      <PrivateRoute
        exact
        path={`${routes.HOME}:projectId`}
        component={() => <ProjectPage />}
      />
      <PrivateRoute
        exact
        path={`${routes.VARIATION_LIST_PAGE}/:projectId`}
        component={() => <TestVariationPage />}
      />
      <PrivateRoute
        exact
        path={`${routes.HOME}`}
        component={() => <Redirect to={routes.PROJECT_LIST_PAGE} />}
      />
    </Switch>
  );
}

export default Router;
