import React from "react";
import { SnackbarProvider } from "notistack";
import { Box, useMediaQuery } from "@mui/material";
import CssBaseline from '@mui/material/CssBaseline';
import {
  ThemeProvider,
  StyledEngineProvider,
  createTheme,
} from "@mui/material/styles";
import { grey, purple, lightBlue } from "@mui/material/colors";
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

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Update the theme only if the mode changes
  // https://mui.com/material-ui/customization/color/#2014-material-design-color-palettes
  const theme = React.useMemo(() => createTheme({
    palette: {
      primary: {
        main: lightBlue[600],
        light: lightBlue[900],
        dark: lightBlue[100],
      },
      secondary: {
        main: purple[500],
      },
      text: {
        primary: prefersDarkMode ? grey[100] : grey[900],
        secondary: prefersDarkMode ? grey[200] : grey[800],
      },
      background: {
        default: prefersDarkMode ? grey[800] : grey[200],
        paper: prefersDarkMode ? grey[700] : grey[300],
      },
      mode: prefersDarkMode ? 'dark' : 'light',
    },
  }
  ), [prefersDarkMode]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>      
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <UserProvider>
            <ProjectProvider>
              <BuildProvider>
                <TestRunProvider>
                  <SocketProvider>
                    <HelpProvider>
                      <Box sx={{ height: "10%", bgcolor: theme.palette.background.paper }}>
                        <Header />
                      </Box>
                      <Box sx={{ height: "90%", bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
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
