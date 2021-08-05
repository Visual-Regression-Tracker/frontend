import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProjectsListPage from "./pages/ProjectListPage";
import ProjectPage from "./pages/ProjectPage";
import PrivateRoute from "./components/PrivateRoute";
import { routes } from "./constants";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import TestVariationListPage from "./pages/TestVariationListPage";
import UserListPage from "./pages/UserListPage";
import TestVariationDetailsPage from "./pages/TestVariationDetailsPage";

function Router() {
  return (
    <Switch>
      <Route
        exact
        path={routes.LOGIN}
        component={() => (
          <LoginPage />
        )}
      />
      <Route exact path={routes.REGISTER} component={() => <RegisterPage />} />
      <Redirect exact from={routes.HOME} to={routes.PROJECT_LIST_PAGE} />
      <PrivateRoute
        exact
        path={routes.PROFILE_PAGE}
        component={() => <ProfilePage />}
      />
      <PrivateRoute
        exact
        path={routes.PROJECT_LIST_PAGE}
        component={() => (
          <ProjectsListPage />
        )}
      />
      <PrivateRoute
        exact
        path={routes.USER_LIST_PAGE}
        component={() => <UserListPage />}
      />
      <PrivateRoute
        exact
        path={`${routes.HOME}:projectId`}
        component={() => (
          <ProjectPage />
        )}
      />
      <PrivateRoute
        exact
        path={`${routes.VARIATION_LIST_PAGE}/:projectId`}
        component={() => (
          <TestVariationListPage />
        )}
      />
      <PrivateRoute
        exact
        path={`${routes.VARIATION_DETAILS_PAGE}/:testVariationId`}
        component={() => <TestVariationDetailsPage />}
      />
    </Switch>
  );
}

export default Router;
