import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import {
  UserProvider,
  ProjectProvider,
  BuildProvider,
  TestRunProvider,
  HelpProvider,
} from "../contexts";
import { theme } from "../theme";
import { User } from "../types";

interface Options extends Omit<RenderOptions, "wrapper"> {
  // where the MemoryRouter starts
  route?: string;
  // the logged in user, seeded the way the app keeps it; null logs out
  user?: User | null;
}

// Renders a component inside the providers App sets up, minus the socket.
// Services are expected to be mocked by the test (vi.mock("../services")).
export function renderWithProviders(
  ui: React.ReactElement,
  { route = "/", user = null, ...options }: Options = {},
) {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        <SnackbarProvider>
          <UserProvider>
            <ProjectProvider>
              <BuildProvider>
                <TestRunProvider>
                  <HelpProvider>{children}</HelpProvider>
                </TestRunProvider>
              </BuildProvider>
            </ProjectProvider>
          </UserProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
