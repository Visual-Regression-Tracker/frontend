import React from "react";
import { SnackbarProvider } from "notistack";
import Header from "./components/Header";
import {
  AuthProvider,
  ProjectProvider,
  BuildProvider,
  TestRunProvider,
  SocketProvider,
} from "./contexts";
import Router from "./Router";

function App() {
  return (
    <SnackbarProvider maxSnack={3}>
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
    </SnackbarProvider>
  );
}

export default App;
