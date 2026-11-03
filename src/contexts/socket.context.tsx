import { type ReactNode, useEffect, useRef, useState } from "react";
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

type SocketProviderProps = {
  children: ReactNode;
};

// the reason the server gives when it refuses the token the socket connects with
export const SOCKET_UNAUTHORIZED = "unauthorized";

function SocketProvider({ children }: Readonly<SocketProviderProps>) {
  const [socket, setSocket] = useState<Socket>();
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
    if (!token || !API_URL) {
      return;
    }
    const connection = socketIOClient(API_URL, { auth: { token } });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the effect opens the connection the state holds
    setSocket(connection);

    return () => {
      connection.disconnect();
    };
  }, [token]);

  useRoom(socket, "projectId", selectedProjectId);
  useRoom(socket, "buildId", selectedBuild?.id);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const listeners = {
      connect_error(error: Error) {
        // any other reason is a failed attempt that socket.io retries
        if (error.message === SOCKET_UNAUTHORIZED) {
          logout(userDispatch);
        }
      },

      // the server closes the socket when its token expires or its user is deleted
      disconnect(reason: Socket.DisconnectReason) {
        if (reason === "io server disconnect") {
          logout(userDispatch);
        }
      },

      build_created(build: Build) {
        if (build.projectId === selectedProjectId) {
          addBuild(buildDispatch, build);
        }
      },

      build_updated(builds: Build[]) {
        updateBuild(
          buildDispatch,
          builds.filter((build) => build.projectId === selectedProjectId),
        );
      },

      build_deleted(build: Build) {
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
      },

      testRun_created(testRuns: TestRun[]) {
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
      },

      testRun_updated(testRuns: TestRun[]) {
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
      },

      testRun_deleted(testRuns: TestRun[]) {
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
      },
    };

    for (const [event, listener] of Object.entries(listeners)) {
      socket.on(event, listener);
    }

    return () => {
      for (const [event, listener] of Object.entries(listeners)) {
        socket.off(event, listener);
      }
    };
  }, [
    socket,
    selectedBuild,
    selectedProjectId,
    buildDispatch,
    testRunDispatch,
    userDispatch,
    navigate,
    enqueueSnackbar,
  ]);

  return children;
}

// with WS_BROADCAST off the server sends build events to project rooms and test run events to build rooms
function useRoom(
  socket: Socket | undefined,
  key: "projectId" | "buildId",
  id: string | null | undefined,
) {
  useEffect(() => {
    if (!socket || !id) {
      return;
    }
    const room = { [key]: id };
    const join = () => socket.emit("join", room);
    // a reconnected socket starts in no room; emits while disconnected would queue up and replay
    if (socket.connected) {
      join();
    }
    socket.on("connect", join);

    return () => {
      socket.off("connect", join);
      if (socket.connected) {
        socket.emit("leave", room);
      }
    };
  }, [socket, key, id]);
}

export { SocketProvider };
