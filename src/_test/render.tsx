import { type ReactElement, type ReactNode, useEffect } from "react";
import { act, render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import type { Socket } from "socket.io-client";
import {
  UserProvider,
  ProjectProvider,
  BuildProvider,
  TestRunProvider,
  SocketProvider,
  HelpProvider,
  useSocketDispatch,
} from "../contexts";
import { theme } from "../theme";
import { User } from "../types";

type Handler = (payload: unknown) => void;

export interface FakeSocket {
  connected: boolean;
  on: (event: string, handler: Handler) => FakeSocket;
  off: (event: string, handler: Handler) => FakeSocket;
  // what the app sends to the server, such as join and leave
  emit: (event: string, body?: unknown) => FakeSocket;
  // an event from the server, inside act() so React settles
  receive: (event: string, payload: unknown) => void;
  listening: () => string[];
  sent: (event: string) => unknown[];
}

export function createFakeSocket(): FakeSocket {
  const handlers = new Map<string, Handler[]>();
  const emitted: [string, unknown][] = [];
  const socket: FakeSocket = {
    connected: true,
    on: (event, handler) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      return socket;
    },
    off: (event, handler) => {
      const rest = (handlers.get(event) ?? []).filter((h) => h !== handler);
      if (rest.length > 0) {
        handlers.set(event, rest);
      } else {
        handlers.delete(event);
      }
      return socket;
    },
    emit: (event, body) => {
      emitted.push([event, body]);
      return socket;
    },
    receive: (event, payload) => {
      act(() => {
        (handlers.get(event) ?? []).forEach((handler) => handler(payload));
      });
    },
    listening: () => [...handlers.keys()],
    sent: (event) =>
      emitted.filter(([name]) => name === event).map(([, body]) => body),
  };
  return socket;
}

// SocketProvider connects only when the API url is configured, which it is not under test
const ConnectFakeSocket = ({ socket }: { socket: FakeSocket }) => {
  const dispatch = useSocketDispatch();

  useEffect(() => {
    dispatch({ type: "connect", payload: socket as unknown as Socket });
  }, [dispatch, socket]);

  return null;
};

interface Options extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  user?: User | null;
  // when given, the app's SocketProvider is mounted and listens on this socket
  socket?: FakeSocket;
}

// Services are expected to be mocked by the test (vi.mock("../services"))
export function renderWithProviders(
  ui: ReactElement,
  { route = "/", user = null, socket, ...options }: Options = {},
) {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        <SnackbarProvider>
          <UserProvider>
            <ProjectProvider>
              <BuildProvider>
                <TestRunProvider>
                  {socket ? (
                    <SocketProvider>
                      <ConnectFakeSocket socket={socket} />
                      <HelpProvider>{children}</HelpProvider>
                    </SocketProvider>
                  ) : (
                    <HelpProvider>{children}</HelpProvider>
                  )}
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
