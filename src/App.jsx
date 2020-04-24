import React from "react";
import { Route, Switch } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import ProjectsListPage from "./pages/ProjectListPage";
import ProjectPage from "./pages/ProjectPage";
import TestDetailsPage from "./pages/TestDetailsPage";
import { AuthProvider } from "./contexts/auth.context";
import PrivateRoute from "./components/PrivateRoute";
import { routes } from "./constants";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Header />
        <Switch>
          <Route exact path="/login" component={() => <LoginPage />} />
          <PrivateRoute exact path="/" component={() => <ProjectsListPage />} />
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
      </AuthProvider>
    </div>
  );
}

export default App;
