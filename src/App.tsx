import React from "react";
import { SnackbarProvider } from "notistack";
import { Box } from "@mui/material";
import {
  ThemeProvider,
  StyledEngineProvider,
  createTheme,
} from "@mui/material/styles";
import { indigo, purple } from "@mui/material/colors";
import Header from "./components/Header";
import {
  UserProvider,
  ProjectProvider,
  BuildProvider,
  TestRunProvider,
  SocketProvider,
  HelpProvider,
} from "./contexts";
import Router from "./Router";

// https://mui.com/material-ui/customization/color/#2014-material-design-color-palettes
const theme = createTheme({
  palette: {
    primary: indigo,
    secondary: purple,
  },
});

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <UserProvider>
            <ProjectProvider>
              <BuildProvider>
                <TestRunProvider>
                  <SocketProvider>
                    <HelpProvider>
                      <Box sx={{ height: "10%" }}>
                        <Header />
                      </Box>
                      <Box sx={{ height: "90%" }}>
                        <Router />
                      </Box>
                    </HelpProvider>
                  </SocketProvider>
                </TestRunProvider>
              </BuildProvider>
            </ProjectProvider>
          </UserProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
