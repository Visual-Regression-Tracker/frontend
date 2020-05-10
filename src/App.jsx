import React from "react";
import "./App.css";
import Header from "./components/Header";
import { AuthProvider } from "./contexts/auth.context";
import Router from "./Router";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Header />
        <Router />
      </AuthProvider>
    </div>
  );
}

export default App;
