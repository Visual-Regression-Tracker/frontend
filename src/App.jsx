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
import { SocketProvider } from "./contexts/socket.context";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <ProjectProvider>
          <BuildProvider>
            <TestRunProvider>
              <SocketProvider>
                <Header />
                <Router />
              </SocketProvider>
            </TestRunProvider>
          </BuildProvider>
        </ProjectProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
