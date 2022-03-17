import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
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
    <Routes>
      <Route path={routes.LOGIN} element={<LoginPage />} />
      <Route path={routes.REGISTER} element={<RegisterPage />} />
      <Route
        path={routes.PROFILE_PAGE}
        element={<PrivateRoute component={ProfilePage} />}
      />
      <Route
        path={routes.PROJECT_LIST_PAGE}
        element={<PrivateRoute component={ProjectsListPage} />}
      />
      <Route
        path={routes.USER_LIST_PAGE}
        element={<PrivateRoute component={UserListPage} />}
      />
      <Route
        path={`${routes.HOME}:projectId`}
        element={<PrivateRoute component={ProjectPage} />}
      />
      <Route
        path={`${routes.VARIATION_LIST_PAGE}/:projectId`}
        element={<PrivateRoute component={TestVariationListPage} />}
      />
      <Route
        path={`${routes.VARIATION_DETAILS_PAGE}/:testVariationId`}
        element={<PrivateRoute component={TestVariationDetailsPage} />}
      />
      <Route path="*" element={<Navigate to={routes.PROJECT_LIST_PAGE} />} />
    </Routes>
  );
}

export default Router;
