import React from "react";
import { mount } from "@cypress/react";
import {
  ProjectProvider,
  UserProvider,
  BuildProvider,
  TestRunProvider,
} from "../contexts";
import { MemoryRouter, Route } from "react-router-dom";
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
      <Route path={path}>
        <SnackbarProvider>
          <UserProvider>
            <ProjectProvider>
              <BuildProvider>
                <TestRunProvider>{component}</TestRunProvider>
              </BuildProvider>
            </ProjectProvider>
          </UserProvider>
        </SnackbarProvider>
      </Route>
    </MemoryRouter>,
    {
      stylesheets: ["/src/index.css"],
    }
  );
