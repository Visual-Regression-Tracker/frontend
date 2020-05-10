import React from "react";
import { Route, Switch } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProjectsListPage from "./pages/ProjectListPage";
import ProjectPage from "./pages/ProjectPage";
import TestDetailsPage from "./pages/TestDetailsPage";
import PrivateRoute from "./components/PrivateRoute";
import { routes } from "./constants";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

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
        path={routes.PROJECTS_PAGE}
        component={() => <ProjectsListPage />}
      />
      <PrivateRoute
        exact
        path={`${routes.PROJECT}/:projectId`}
        component={() => <ProjectPage />}
      />
      <PrivateRoute
        exact
        path={`${routes.TEST_DETAILS_PAGE}/:testId`}
        component={() => <TestDetailsPage />}
      />
    </Switch>
  );
}

export default Router;
