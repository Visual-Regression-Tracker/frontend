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

const handlers = vi.hoisted(
  () => new Map<string, (payload: unknown) => void>(),
);
const fakeSocket = vi.hoisted(() => ({
  on: vi.fn((event: string, handler: (payload: unknown) => void) => {
    handlers.set(event, handler);
  }),
  removeAllListeners: vi.fn(() => handlers.clear()),
  disconnect: vi.fn(),
}));

vi.mock("socket.io-client", () => ({
  default: vi.fn(() => fakeSocket),
}));

const emit = (event: string, payload: unknown) => {
  const handler = handlers.get(event);
  if (!handler) {
    throw new Error(`nothing is listening to ${event}`);
  }
  act(() => handler(payload));
};

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

      emit("connect_error", new Error(SOCKET_UNAUTHORIZED));

      expect(loggedIn().getByText("false")).toBeVisible();
      expect(localStorage.getItem("user")).toBeNull();
    });

    it("stays logged in when the connection fails for another reason", async () => {
      await renderSocket();

      emit("connect_error", new Error("xhr poll error"));

      expect(loggedIn().getByText("true")).toBeVisible();
    });
  });

  describe("build_created", () => {
    it("puts a new build of the selected project first in the list", async () => {
      await renderSocket({ builds: [SELECTED_BUILD] });

      emit("build_created", build("new-build", { status: BuildStatus.passed }));

      expect(listed("builds")).toEqual([
        "new-build:passed",
        "selected-build:failed",
      ]);
    });

    it("ignores a build of another project", async () => {
      await renderSocket({ builds: [SELECTED_BUILD] });

      emit("build_created", build("foreign", { projectId: OTHER_PROJECT_ID }));

      expect(listed("builds")).toEqual(["selected-build:failed"]);
    });
  });

  describe("build_updated", () => {
    it("replaces the builds that were updated and leaves the others", async () => {
      const untouched = build("untouched");
      await renderSocket({ builds: [SELECTED_BUILD, untouched] });

      emit("build_updated", [
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

      emit("build_updated", [
        build(SELECTED_BUILD.id, { status: BuildStatus.passed }),
      ]);

      expect(screen.getByTestId("selectedBuild")).toHaveTextContent(
        "selected-build:passed",
      );
      expect(listed("builds")).toEqual(["selected-build:passed"]);
    });

    it("ignores updates to builds of another project", async () => {
      await renderSocket();

      emit("build_updated", [
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

      emit("build_deleted", build("other"));

      expect(listed("builds")).toEqual(["selected-build:failed"]);
    });
  });

  describe("testRun_created", () => {
    it("adds the new test runs of the open build", async () => {
      await renderSocket({ testRuns: [testRun("existing")] });

      emit("testRun_created", [testRun("created-1"), testRun("created-2")]);

      expect(listed("testRuns")).toEqual([
        "existing:unresolved",
        "created-1:unresolved",
        "created-2:unresolved",
      ]);
    });

    it("ignores test runs of other builds", async () => {
      await renderSocket({ testRuns: [testRun("existing")] });

      emit("testRun_created", [
        testRun("created-elsewhere", { buildId: "another-build" }),
      ]);

      expect(listed("testRuns")).toEqual(["existing:unresolved"]);
    });

    it("does not add a test run twice", async () => {
      await renderSocket({ testRuns: [testRun("existing")] });

      emit("testRun_created", [testRun("existing"), testRun("fresh")]);

      expect(listed("testRuns")).toEqual([
        "existing:unresolved",
        "fresh:unresolved",
      ]);
    });

    it("keeps the state an earlier update brought over a late created batch", async () => {
      await renderSocket();

      emit("testRun_updated", [
        testRun("uploaded", { status: TestStatus.approved }),
      ]);
      emit("testRun_created", [testRun("uploaded")]);

      expect(listed("testRuns")).toEqual(["uploaded:approved"]);
    });

    it("ignores test runs while no build is open", async () => {
      await renderSocket({ openBuild: null });

      emit("testRun_created", [testRun("created")]);

      expect(listed("testRuns")).toEqual([]);
    });
  });

  describe("testRun_updated", () => {
    it("updates the test runs of the open build", async () => {
      await renderSocket({
        testRuns: [testRun("first"), testRun("second")],
      });

      emit("testRun_updated", [
        testRun("second", { status: TestStatus.approved }),
      ]);

      expect(listed("testRuns")).toEqual([
        "first:unresolved",
        "second:approved",
      ]);
    });

    it("ignores updates to test runs of other builds", async () => {
      await renderSocket({ testRuns: [testRun("first")] });

      emit("testRun_updated", [
        testRun("first", {
          status: TestStatus.approved,
          buildId: "another-build",
        }),
      ]);

      expect(listed("testRuns")).toEqual(["first:unresolved"]);
    });

    it("ignores updates while no build is open", async () => {
      await renderSocket({ openBuild: null, testRuns: [testRun("first")] });

      emit("testRun_updated", [
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

      emit("testRun_deleted", [testRun("first"), testRun("third")]);

      expect(listed("testRuns")).toEqual(["second:unresolved"]);
    });

    it("ignores deletions of test runs of other builds", async () => {
      await renderSocket({ testRuns: [testRun("first")] });

      emit("testRun_deleted", [testRun("first", { buildId: "another-build" })]);

      expect(listed("testRuns")).toEqual(["first:unresolved"]);
    });
  });

  it("re-registers its listeners instead of stacking them when the open build changes", async () => {
    await renderSocket();
    const removalsBefore = fakeSocket.removeAllListeners.mock.calls.length;

    emit("build_updated", [
      build(SELECTED_BUILD.id, { status: BuildStatus.passed }),
    ]);

    expect(fakeSocket.removeAllListeners.mock.calls.length).toBeGreaterThan(
      removalsBefore,
    );
    expect(handlers.size).toBe(7);
  });
});
