import { SnackbarProvider, closeSnackbar } from "notistack";
import { Box, CssBaseline, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
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
import { theme } from "./theme";

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider
        theme={theme}
        defaultMode="system"
        modeStorageKey="vrt-color-mode"
        disableTransitionOnChange
      >
        <CssBaseline enableColorScheme />
        <SnackbarProvider
          maxSnack={3}
          // toasts go between the build list's bottom-left and the test run list's bottom-right pagination
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          action={(key) => (
            <IconButton
              size="small"
              color="inherit"
              aria-label="Dismiss notification"
              onClick={() => closeSnackbar(key)}
              data-testid="dismissNotification"
            >
              <Close data-testid="CloseIcon" fontSize="small" />
            </IconButton>
          )}
        >
          <UserProvider>
            <ProjectProvider>
              <BuildProvider>
                <TestRunProvider>
                  <SocketProvider>
                    <HelpProvider>
                      <Box
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Header />
                        <Box
                          component="main"
                          sx={{ flex: 1, minHeight: 0, overflow: "auto" }}
                        >
                          <Router />
                        </Box>
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
