import React from "react";
import { Route, Switch } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import { AuthProvider } from "./contexts/auth.context";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Header />
        <Switch>
          <Route exact path="/login" component={() => <LoginPage />} />
          <PrivateRoute exact path="/" component={() => <h1>Home</h1>} />
        </Switch>
      </AuthProvider>
    </div>
  );
}

export default App;
