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
  let helpSteps = [];

  const getHelpSteps = () => {
    const firstStep = helpSteps[0];
    //Below line is to prevent application breaking if element is not present for any reason (e.g. if the user deletes build or if there is no data.)
    if (firstStep && document.getElementById(firstStep.target.slice(1))) {
      return helpSteps;
    }
    return [];
  };

  const populateHelpSteps = (steps) => {
    helpSteps = steps;
  };

  return (
    <SnackbarProvider maxSnack={3}>
      <AuthProvider>
        <ProjectProvider>
          <BuildProvider>
            <TestRunProvider>
              <SocketProvider>
                <Box height="10%">
                  <Header getHelpSteps={() => getHelpSteps()} />
                </Box>
                <Box height="90%">
                  <Router
                    populateHelpSteps={(steps) => populateHelpSteps(steps)}
                  />
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
