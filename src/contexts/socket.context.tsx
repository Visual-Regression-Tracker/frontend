import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import socketIOClient, { Socket } from "socket.io-client";
import {
  useBuildState,
  useBuildDispatch,
  addBuild,
  updateBuild,
  consumeOwnDelete,
} from "./build.context";
import { Build, TestRun } from "../types";
import {
  useTestRunDispatch,
  useTestRunState,
  addTestRun,
  updateTestRun,
  deleteTestRun,
} from "./testRun.context";
import { API_URL } from "../_config/env.config";
import { useProjectState } from "./project.context";
import { logout, useUserDispatch, useUserState } from "./user.context";
import { buildTestRunLocation } from "../_helpers/route.helpers";

interface IConnectAction {
  type: "connect";
  payload: Socket;
}

type IAction = IConnectAction;
type Dispatch = (action: IAction) => void;
type State = {
  socket: Socket | undefined;
};
type SocketProviderProps = {
  children: ReactNode;
};

// the reason the server gives when it refuses the token the socket connects with
export const SOCKET_UNAUTHORIZED = "unauthorized";

const SocketStateContext = createContext<State | undefined>(undefined);
const SocketDispatchContext = createContext<Dispatch | undefined>(undefined);

const initialState: State = {
  socket: undefined,
};

export function socketReducer(state: State, action: IAction): State {
  if (action.type === "connect") {
    return {
      socket: action.payload,
    };
  }
  return state;
}

function SocketProvider({ children }: Readonly<SocketProviderProps>) {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { selectedBuild } = useBuildState();
  const { selectedProjectId } = useProjectState();
  const testRunDispatch = useTestRunDispatch();
  const buildDispatch = useBuildDispatch();
  const userDispatch = useUserDispatch();
  const token = useUserState().user?.token;
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  // a ref: paging through runs would otherwise re-register every handler on each step
  const openTestRunId = useTestRunState().selectedTestRun?.id;
  const selectedTestRunId = useRef(openTestRunId);
  useEffect(() => {
    selectedTestRunId.current = openTestRunId;
  }, [openTestRunId]);

  // the server identifies the connection by token; a login or logout needs a connection of its own
  useEffect(() => {
    if (!token) {
      return;
    }
    const socket = connect(dispatch, token);

    return () => {
      socket?.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (state.socket) {
      state.socket.removeAllListeners();

      state.socket.on("connect_error", function (error: Error) {
        // any other reason is a failed attempt that socket.io retries
        if (error.message === SOCKET_UNAUTHORIZED) {
          logout(userDispatch);
        }
      });

      state.socket.on("build_created", function (build: Build) {
        if (build.projectId === selectedProjectId) {
          addBuild(buildDispatch, build);
        }
      });

      state.socket.on("build_updated", function (builds: Build[]) {
        updateBuild(
          buildDispatch,
          builds.filter((build) => build.projectId === selectedProjectId),
        );
      });

      state.socket.on("build_deleted", function (build: Build) {
        const deletedHere = consumeOwnDelete(build.id);
        buildDispatch({
          type: "delete",
          payload: build.id,
        });

        if (build.id === selectedBuild?.id) {
          navigate(buildTestRunLocation());
          if (!deletedHere) {
            enqueueSnackbar("This build was deleted", { variant: "info" });
          }
        }
      });

      state.socket.on("testRun_created", function (testRuns: TestRun[]) {
        if (!selectedBuild) {
          return;
        }

        // events for other builds arrive too; an empty dispatch would still replace the huge testRuns array
        const created = testRuns.filter(
          (tr) => tr.buildId === selectedBuild.id,
        );
        if (created.length === 0) {
          return;
        }

        addTestRun(testRunDispatch, created);
      });

      state.socket.on("testRun_updated", function (testRuns: TestRun[]) {
        if (!selectedBuild) {
          return;
        }

        const updated = testRuns.filter(
          (tr) => tr.buildId === selectedBuild.id,
        );
        if (updated.length === 0) {
          return;
        }

        updateTestRun(testRunDispatch, updated);
      });

      state.socket.on("testRun_deleted", function (testRuns: TestRun[]) {
        if (!selectedBuild) {
          return;
        }

        const deleted = testRuns
          .filter((tr) => tr.buildId === selectedBuild.id)
          .map((testRun) => testRun.id);
        if (deleted.length === 0) {
          return;
        }

        deleteTestRun(testRunDispatch, deleted);

        const openId = selectedTestRunId.current;
        if (openId && deleted.includes(openId)) {
          navigate(buildTestRunLocation(selectedBuild.id));
          enqueueSnackbar("This test run was deleted", { variant: "info" });
        }
      });
    }
  }, [
    state.socket,
    selectedBuild,
    selectedProjectId,
    buildDispatch,
    testRunDispatch,
    userDispatch,
    navigate,
    enqueueSnackbar,
  ]);

  return (
    <SocketStateContext.Provider value={state}>
      <SocketDispatchContext.Provider value={dispatch}>
        {children}
      </SocketDispatchContext.Provider>
    </SocketStateContext.Provider>
  );
}

function useSocketDispatch() {
  const context = useContext(SocketDispatchContext);

  if (context === undefined) {
    throw Error("must be used within a SocketProvider");
  }

  return context;
}

function connect(dispatch: Dispatch, token: string): Socket | undefined {
  if (!API_URL) {
    return undefined;
  }
  const socket = socketIOClient(API_URL, { auth: { token } });
  dispatch({
    type: "connect",
    payload: socket,
  });

  return socket;
}

export { SocketProvider, useSocketDispatch, connect };
