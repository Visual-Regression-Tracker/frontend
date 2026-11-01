import { useEffect } from "react";
import { act, screen, within } from "@testing-library/react";
import socketIOClient from "socket.io-client";
import { renderWithProviders } from "../_test/render";
import { SeedTestRuns } from "../_test/SeedTestRuns";
import { buildsService } from "../services";
import {
  SocketProvider,
  selectProject,
  useBuildDispatch,
  useBuildState,
  useProjectDispatch,
  useTestRunState,
  useUserDispatch,
  useUserState,
  logout,
  SOCKET_UNAUTHORIZED,
} from ".";
import { Build, TestRun, TestStatus, User } from "../types";
import { BuildStatus } from "../types/buildStatus";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_USER,
  testRunMock,
} from "../_test/test.data.helper";

const API = vi.hoisted(() => "http://api.test");

vi.mock("../_config/env.config", () => ({
  API_URL: API,
  STATIC_URL: undefined,
  VRT_VERSION: "test",
  OIDC_AUTO_REDIRECT: false,
}));

type Listener = (payload?: unknown) => void;

const handlers = vi.hoisted(() => new Map<string, Set<Listener>>());
const fakeSocket = vi.hoisted(() => ({
  connected: true,
  on: vi.fn((event: string, handler: Listener) => {
    handlers.set(event, (handlers.get(event) ?? new Set()).add(handler));
  }),
  off: vi.fn((event: string, handler: Listener) => {
    handlers.get(event)?.delete(handler);
    if (handlers.get(event)?.size === 0) handlers.delete(event);
  }),
  disconnect: vi.fn(),
  emit: vi.fn<(event: string, body?: unknown) => void>(),
}));

vi.mock("socket.io-client", () => ({
  default: vi.fn(() => fakeSocket),
}));

// an event from the server
const receive = (event: string, payload?: unknown) => {
  const listeners = handlers.get(event);
  if (!listeners) {
    throw new Error(`nothing is listening to ${event}`);
  }
  act(() => listeners.forEach((listener) => listener(payload)));
};

const reconnect = () => receive("connect");

const sent = (event: string) =>
  fakeSocket.emit.mock.calls
    .filter(([name]) => name === event)
    .map(([, body]) => body);

const build = (id: string, changes: Partial<Build> = {}): Build => ({
  ...TEST_BUILD_FAILED,
  id,
  projectId: TEST_PROJECT.id,
  ...changes,
});

const testRun = (id: string, changes: Partial<TestRun> = {}): TestRun => ({
  ...testRunMock,
  id,
  buildId: SELECTED_BUILD.id,
  status: TestStatus.unresolved,
  ...changes,
});

const SELECTED_BUILD = build("selected-build");
const OTHER_PROJECT_ID = "another-project";

const Consumer = ({ builds }: { builds: Build[] }) => {
  const buildDispatch = useBuildDispatch();
  const projectDispatch = useProjectDispatch();
  const { buildList, selectedBuild } = useBuildState();
  const { testRuns } = useTestRunState();

  useEffect(() => {
    buildDispatch({
      type: "get",
      payload: { data: builds, take: 10, skip: 0, total: builds.length },
    });
    selectProject(projectDispatch, TEST_PROJECT.id);
  }, [buildDispatch, projectDispatch, builds]);

  return (
    <>
      <button onClick={() => selectProject(projectDispatch, OTHER_PROJECT_ID)}>
        Open another project
      </button>
      <div data-testid="selectedBuild">
        {selectedBuild ? `${selectedBuild.id}:${selectedBuild.status}` : "none"}
      </div>
      <ul data-testid="builds">
        {buildList.map((item) => (
          <li key={item.id}>{`${item.id}:${item.status}`}</li>
        ))}
      </ul>
      <ul data-testid="testRuns">
        {testRuns.map((item) => (
          <li key={item.id}>{`${item.id}:${item.status}`}</li>
        ))}
      </ul>
    </>
  );
};

const listed = (testId: "builds" | "testRuns") =>
  Array.from(screen.getByTestId(testId).querySelectorAll("li")).map(
    (item) => item.textContent,
  );

const Session = () => {
  const dispatch = useUserDispatch();
  const { loggedIn } = useUserState();

  return (
    <>
      <div data-testid="loggedIn">{String(loggedIn)}</div>
      <button onClick={() => logout(dispatch)}>Log out</button>
      <button
        onClick={() =>
          dispatch({
            type: "success",
            payload: { ...TEST_USER, token: NEW_TOKEN },
          })
        }
      >
        Log in again
      </button>
    </>
  );
};

const NEW_TOKEN = "new-token";

const renderSocket = async ({
  builds = [SELECTED_BUILD],
  testRuns = [],
  openBuild = SELECTED_BUILD,
  user = TEST_USER,
}: {
  builds?: Build[];
  testRuns?: TestRun[];
  openBuild?: Build | null;
  user?: User | null;
} = {}) => {
  if (openBuild) {
    vi.spyOn(buildsService, "getDetails").mockResolvedValue(openBuild);
  }
  const result = renderWithProviders(
    <SocketProvider>
      <SeedTestRuns testRuns={testRuns} />
      <Consumer builds={builds} />
      <Session />
    </SocketProvider>,
    { route: openBuild ? `/?buildId=${openBuild.id}` : "/", user },
  );
  if (openBuild) {
    await vi.waitFor(() =>
      expect(screen.getByTestId("selectedBuild")).toHaveTextContent(
        `${openBuild.id}:${openBuild.status}`,
      ),
    );
    // the effect that re-subscribes the handlers with the open build may still be pending
    await act(async () => {});
  }
  await vi.waitFor(() => expect(handlers.has("build_created")).toBe(true));
  return result;
};

describe("SocketProvider", () => {
  beforeEach(() => {
    handlers.clear();
    fakeSocket.connected = true;
    // clearMocks keeps implementations, but a restored spy would not
    vi.mocked(socketIOClient).mockReturnValue(fakeSocket as never);
  });

  it("connects to the API and listens for every build and test run event", async () => {
    await renderSocket();

    expect(socketIOClient).toHaveBeenCalledWith(API, {
      auth: { token: TEST_USER.token },
    });
    expect(
      [...handlers.keys()].sort((a: string, b: string) => a.localeCompare(b)),
    ).toEqual([
      "build_created",
      "build_deleted",
      "build_updated",
      "connect",
      "connect_error",
      "testRun_created",
      "testRun_deleted",
      "testRun_updated",
    ]);
  });

  describe("authentication", () => {
    const loggedIn = () => within(screen.getByTestId("loggedIn"));

    beforeEach(() => {
      vi.mocked(socketIOClient).mockClear();
      fakeSocket.disconnect.mockClear();
    });

    it("sends the user's token when it connects", async () => {
      await renderSocket();

      expect(socketIOClient).toHaveBeenCalledTimes(1);
      expect(socketIOClient).toHaveBeenCalledWith(API, {
        auth: { token: TEST_USER.token },
      });
    });

    it("does not connect while nobody is logged in", async () => {
      renderWithProviders(
        <SocketProvider>
          <Session />
        </SocketProvider>,
      );

      await act(async () => {});

      expect(screen.getByTestId("loggedIn")).toHaveTextContent("false");
      expect(socketIOClient).not.toHaveBeenCalled();
    });

    it("disconnects when the user logs out", async () => {
      const { user } = await renderSocket();
      expect(fakeSocket.disconnect).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Log out" }));

      expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
      expect(socketIOClient).toHaveBeenCalledTimes(1);
    });

    it("connects again with the new token after a login", async () => {
      const { user } = await renderSocket();

      await user.click(screen.getByRole("button", { name: "Log in again" }));

      expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
      expect(socketIOClient).toHaveBeenCalledTimes(2);
      expect(socketIOClient).toHaveBeenLastCalledWith(API, {
        auth: { token: NEW_TOKEN },
      });
    });

    it("disconnects when it is taken off the page", async () => {
      const { unmount } = await renderSocket();

      unmount();

      expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
    });

    it("logs the user out when the server refuses the token", async () => {
      await renderSocket();
      expect(loggedIn().getByText("true")).toBeVisible();

      receive("connect_error", new Error(SOCKET_UNAUTHORIZED));

      expect(loggedIn().getByText("false")).toBeVisible();
      expect(localStorage.getItem("user")).toBeNull();
    });

    it("stays logged in when the connection fails for another reason", async () => {
      await renderSocket();

      receive("connect_error", new Error("xhr poll error"));

      expect(loggedIn().getByText("true")).toBeVisible();
    });
  });

  describe("rooms", () => {
    it("joins the room of the selected project and the room of the open build", async () => {
      await renderSocket();

      expect(sent("join")).toEqual(
        expect.arrayContaining([
          { projectId: TEST_PROJECT.id },
          { buildId: SELECTED_BUILD.id },
        ]),
      );
      expect(sent("leave")).toEqual([]);
    });

    it("joins only the project's room while no build is open", async () => {
      await renderSocket({ openBuild: null });

      expect(sent("join")).toEqual([{ projectId: TEST_PROJECT.id }]);
    });

    it("leaves the project's room for the room of the project opened next", async () => {
      const { user } = await renderSocket({ openBuild: null });
      fakeSocket.emit.mockClear();

      await user.click(
        screen.getByRole("button", { name: "Open another project" }),
      );

      expect(sent("leave")).toEqual([{ projectId: TEST_PROJECT.id }]);
      expect(sent("join")).toEqual([{ projectId: OTHER_PROJECT_ID }]);
    });

    it("joins its rooms again when the connection comes back", async () => {
      await renderSocket();
      fakeSocket.emit.mockClear();

      reconnect();

      expect(sent("join")).toHaveLength(2);
      expect(sent("join")).toEqual(
        expect.arrayContaining([
          { projectId: TEST_PROJECT.id },
          { buildId: SELECTED_BUILD.id },
        ]),
      );
    });

    it("does not join a room again after it left it", async () => {
      const { user } = await renderSocket({ openBuild: null });
      await user.click(
        screen.getByRole("button", { name: "Open another project" }),
      );
      fakeSocket.emit.mockClear();

      reconnect();

      expect(sent("join")).toEqual([{ projectId: OTHER_PROJECT_ID }]);
    });
  });

  describe("rooms while disconnected", () => {
    it("joins once the socket connects and sends nothing before", async () => {
      fakeSocket.connected = false;
      const { user } = await renderSocket({ openBuild: null });

      await user.click(
        screen.getByRole("button", { name: "Open another project" }),
      );
      expect(fakeSocket.emit).not.toHaveBeenCalled();

      fakeSocket.connected = true;
      reconnect();

      expect(sent("join")).toEqual([{ projectId: OTHER_PROJECT_ID }]);
      expect(sent("leave")).toEqual([]);
    });
  });

  describe("build_created", () => {
    it("puts a new build of the selected project first in the list", async () => {
      await renderSocket({ builds: [SELECTED_BUILD] });

      receive(
        "build_created",
        build("new-build", { status: BuildStatus.passed }),
      );

      expect(listed("builds")).toEqual([
        "new-build:passed",
        "selected-build:failed",
      ]);
    });

    it("ignores a build of another project", async () => {
      await renderSocket({ builds: [SELECTED_BUILD] });

      receive(
        "build_created",
        build("foreign", { projectId: OTHER_PROJECT_ID }),
      );

      expect(listed("builds")).toEqual(["selected-build:failed"]);
    });
  });

  describe("build_updated", () => {
    it("replaces the builds that were updated and leaves the others", async () => {
      const untouched = build("untouched");
      await renderSocket({ builds: [SELECTED_BUILD, untouched] });

      receive("build_updated", [
        build("untouched", { status: BuildStatus.passed }),
        build("not-in-list", { status: BuildStatus.passed }),
      ]);

      expect(listed("builds")).toEqual([
        "selected-build:failed",
        "untouched:passed",
      ]);
    });

    it("updates the build that is open", async () => {
      await renderSocket();

      receive("build_updated", [
        build(SELECTED_BUILD.id, { status: BuildStatus.passed }),
      ]);

      expect(screen.getByTestId("selectedBuild")).toHaveTextContent(
        "selected-build:passed",
      );
      expect(listed("builds")).toEqual(["selected-build:passed"]);
    });

    it("ignores updates to builds of another project", async () => {
      await renderSocket();

      receive("build_updated", [
        build(SELECTED_BUILD.id, {
          status: BuildStatus.passed,
          projectId: OTHER_PROJECT_ID,
        }),
      ]);

      expect(listed("builds")).toEqual(["selected-build:failed"]);
      expect(screen.getByTestId("selectedBuild")).toHaveTextContent(
        "selected-build:failed",
      );
    });
  });

  describe("build_deleted", () => {
    it("removes the build from the list", async () => {
      await renderSocket({ builds: [SELECTED_BUILD, build("other")] });

      receive("build_deleted", build("other"));

      expect(listed("builds")).toEqual(["selected-build:failed"]);
    });
  });

  describe("testRun_created", () => {
    it("adds the new test runs of the open build", async () => {
      await renderSocket({ testRuns: [testRun("existing")] });

      receive("testRun_created", [testRun("created-1"), testRun("created-2")]);

      expect(listed("testRuns")).toEqual([
        "existing:unresolved",
        "created-1:unresolved",
        "created-2:unresolved",
      ]);
    });

    it("ignores test runs of other builds", async () => {
      await renderSocket({ testRuns: [testRun("existing")] });

      receive("testRun_created", [
        testRun("created-elsewhere", { buildId: "another-build" }),
      ]);

      expect(listed("testRuns")).toEqual(["existing:unresolved"]);
    });

    it("does not add a test run twice", async () => {
      await renderSocket({ testRuns: [testRun("existing")] });

      receive("testRun_created", [testRun("existing"), testRun("fresh")]);

      expect(listed("testRuns")).toEqual([
        "existing:unresolved",
        "fresh:unresolved",
      ]);
    });

    it("keeps the state an earlier update brought over a late created batch", async () => {
      await renderSocket();

      receive("testRun_updated", [
        testRun("uploaded", { status: TestStatus.approved }),
      ]);
      receive("testRun_created", [testRun("uploaded")]);

      expect(listed("testRuns")).toEqual(["uploaded:approved"]);
    });

    it("ignores test runs while no build is open", async () => {
      await renderSocket({ openBuild: null });

      receive("testRun_created", [testRun("created")]);

      expect(listed("testRuns")).toEqual([]);
    });
  });

  describe("testRun_updated", () => {
    it("updates the test runs of the open build", async () => {
      await renderSocket({
        testRuns: [testRun("first"), testRun("second")],
      });

      receive("testRun_updated", [
        testRun("second", { status: TestStatus.approved }),
      ]);

      expect(listed("testRuns")).toEqual([
        "first:unresolved",
        "second:approved",
      ]);
    });

    it("ignores updates to test runs of other builds", async () => {
      await renderSocket({ testRuns: [testRun("first")] });

      receive("testRun_updated", [
        testRun("first", {
          status: TestStatus.approved,
          buildId: "another-build",
        }),
      ]);

      expect(listed("testRuns")).toEqual(["first:unresolved"]);
    });

    it("ignores updates while no build is open", async () => {
      await renderSocket({ openBuild: null, testRuns: [testRun("first")] });

      receive("testRun_updated", [
        testRun("first", { status: TestStatus.approved }),
      ]);

      expect(listed("testRuns")).toEqual(["first:unresolved"]);
    });
  });

  describe("testRun_deleted", () => {
    it("removes the deleted test runs of the open build", async () => {
      await renderSocket({
        testRuns: [testRun("first"), testRun("second"), testRun("third")],
      });

      receive("testRun_deleted", [testRun("first"), testRun("third")]);

      expect(listed("testRuns")).toEqual(["second:unresolved"]);
    });

    it("ignores deletions of test runs of other builds", async () => {
      await renderSocket({ testRuns: [testRun("first")] });

      receive("testRun_deleted", [
        testRun("first", { buildId: "another-build" }),
      ]);

      expect(listed("testRuns")).toEqual(["first:unresolved"]);
    });
  });

  it("re-registers its listeners instead of stacking them when the open build changes", async () => {
    await renderSocket();

    receive("build_updated", [
      build(SELECTED_BUILD.id, { status: BuildStatus.passed }),
    ]);

    expect(
      Object.fromEntries(
        [...handlers].map(([event, listeners]) => [event, listeners.size]),
      ),
    ).toEqual({
      build_created: 1,
      build_deleted: 1,
      build_updated: 1,
      // one per room: the project's and the open build's
      connect: 2,
      connect_error: 1,
      testRun_created: 1,
      testRun_deleted: 1,
      testRun_updated: 1,
    });
  });
});
