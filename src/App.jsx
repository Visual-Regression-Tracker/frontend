import React, { useContext } from "react";
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
import { HelpContext } from "./contexts/help.context";

function App() {
  const { getHelpSteps } = useContext(HelpContext);
  const { populateHelpSteps } = useContext(HelpContext);
  return (
    <SnackbarProvider maxSnack={3}>
      <AuthProvider>
        <ProjectProvider>
          <BuildProvider>
            <TestRunProvider>
              <SocketProvider>
                <HelpContext.Provider value={{getHelpSteps, populateHelpSteps}}>
                  <Box height="10%">
                    <Header />
                  </Box>
                  <Box height="90%">
                    <Router/>
                  </Box>
                </HelpContext.Provider>
              </SocketProvider>
            </TestRunProvider>
          </BuildProvider>
        </ProjectProvider>
      </AuthProvider>
    </SnackbarProvider>
  );
}

export default App;
