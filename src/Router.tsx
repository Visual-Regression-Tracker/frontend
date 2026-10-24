import React, { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PrivateRoute from "./components/PrivateRoute";
import { routes } from "./constants";

// pages load on first visit, so the login screen does not wait for the
// canvas, the data grid and the rest of the review UI
const ProjectsListPage = lazy(() => import("./pages/ProjectListPage"));
const ProjectPage = lazy(() => import("./pages/ProjectPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const TestVariationListPage = lazy(
  () => import("./pages/TestVariationListPage"),
);
const UserListPage = lazy(() => import("./pages/UserListPage"));
const TestVariationDetailsPage = lazy(
  () => import("./pages/TestVariationDetailsPage"),
);
import { useOidcEnabled } from "./_helpers/useOidcEnabled";

function RegisterRoute() {
  const oidcEnabled = useOidcEnabled();
  if (oidcEnabled === undefined) {
    return null;
  }
  // Accounts are created on the first SSO login when OIDC is enabled.
  return oidcEnabled ? <Navigate to={routes.LOGIN} /> : <RegisterPage />;
}

function Router() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path={routes.LOGIN} element={<LoginPage />} />
        <Route path={routes.REGISTER} element={<RegisterRoute />} />
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
          element={<PrivateRoute component={UserListPage} roles={["admin"]} />}
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
    </Suspense>
  );
}

export default Router;
