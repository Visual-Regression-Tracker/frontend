import React from "react";
import { mount } from "@cypress/react";
import {
  ProjectProvider,
  UserProvider,
  BuildProvider,
  TestRunProvider,
  HelpProvider,
} from "../contexts";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { type MemoryRouterProps } from "react-router";
import { SnackbarProvider } from "notistack";
import "../index.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme();

export const mountVrtComponent = ({
  component,
  memoryRouterProps = {
    initialEntries: ["/"],
  },
  path = "/",
}: {
  component: React.ReactElement;
  memoryRouterProps?: MemoryRouterProps;
  path?: string;
}) =>
  mount(
    <MemoryRouter {...memoryRouterProps}>
      <Routes>
        <Route
          path={path}
          element={
            <ThemeProvider theme={theme}>
              <SnackbarProvider>
                <UserProvider>
                  <ProjectProvider>
                    <BuildProvider>
                      <HelpProvider>
                        <TestRunProvider>{component}</TestRunProvider>
                      </HelpProvider>
                    </BuildProvider>
                  </ProjectProvider>
                </UserProvider>
              </SnackbarProvider>
            </ThemeProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
