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
import { MemoryRouterProps } from "react-router";
import { SnackbarProvider } from "notistack";

export const mountVrtComponent = ({
  component,
  memoryRouterProps,
  path,
}: {
  component: React.ReactElement;
  memoryRouterProps?: MemoryRouterProps;
  path?: string;
}) =>
  mount(
    <MemoryRouter {...memoryRouterProps}>
      <Routes>
        <Route path={path}>
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
        </Route>
      </Routes>
    </MemoryRouter>,
    {
      stylesheets: ["/src/index.css"],
    }
  );
