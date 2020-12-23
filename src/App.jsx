import React from "react";
import { SnackbarProvider } from "notistack";
import { Box } from "@material-ui/core";
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
                <Box height="10%">
                  <Header />
                </Box>
                <Box height="90%">
                  <Router />
                </Box>
              </SocketProvider>
            </TestRunProvider>
          </BuildProvider>
        </ProjectProvider>
      </AuthProvider>
    </SnackbarProvider>
  );
}

export default App;
