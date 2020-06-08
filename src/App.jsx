import React from "react";
import "./App.css";
import Header from "./components/Header";
import { AuthProvider } from "./contexts/auth.context";
import { ProjectProvider } from "./contexts/project.context";
import Router from "./Router";
import { BuildProvider } from "./contexts/build.context";
import { TestRunProvider } from "./contexts/testRun.context";

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
