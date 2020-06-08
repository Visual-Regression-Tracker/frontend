import React from "react";
import "./App.css";
import Header from "./components/Header";
import {
  AuthProvider,
  ProjectProvider,
  BuildProvider,
  TestRunProvider,
} from "./contexts";
import Router from "./Router";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <ProjectProvider>
          <BuildProvider>
            <TestRunProvider>
              <Header />
              <Router />
            </TestRunProvider>
          </BuildProvider>
        </ProjectProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
