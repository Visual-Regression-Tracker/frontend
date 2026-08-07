import React from "react";
import { SnackbarProvider, closeSnackbar } from "notistack";
import { Box, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
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
        <SnackbarProvider
          maxSnack={3}
          // the build list pagination sits bottom left and the test run
          // pagination bottom right, so toasts go between the two
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          action={(key) => (
            <IconButton
              size="small"
              color="inherit"
              aria-label="Dismiss notification"
              onClick={() => closeSnackbar(key)}
              data-testid="dismissNotification"
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        >
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
