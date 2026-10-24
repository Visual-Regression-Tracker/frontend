import React from "react";
import { act, screen } from "@testing-library/react";
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
} from ".";
import { Build, TestRun, TestStatus } from "../types";
import { BuildStatus } from "../types/buildStatus";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  testRunMock,
} from "../_test/test.data.helper";

const API = vi.hoisted(() => "http://api.test");

vi.mock("../_config/env.config", () => ({
  API_URL: API,
  STATIC_URL: undefined,
  VRT_VERSION: "test",
  OIDC_AUTO_REDIRECT: false,
}));

// the handlers the provider registers, by event name, as a real socket would
// call them
const handlers = vi.hoisted(
  () => new Map<string, (payload: unknown) => void>(),
);
const fakeSocket = vi.hoisted(() => ({
  on: vi.fn((event: string, handler: (payload: unknown) => void) => {
    handlers.set(event, handler);
  }),
  removeAllListeners: vi.fn(() => handlers.clear()),
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

// Seeds the builds the list has loaded and picks the project, then lists what
// the contexts hold so a test can read it like a screen
const Consumer: React.FunctionComponent<{ builds: Build[] }> = ({ builds }) => {
  const buildDispatch = useBuildDispatch();
  const projectDispatch = useProjectDispatch();
  const { buildList, selectedBuild } = useBuildState();
  const { testRuns } = useTestRunState();

  React.useEffect(() => {
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

// renders the provider the way App nests it, with a build open by default
const renderSocket = async ({
  builds = [SELECTED_BUILD],
  testRuns = [],
  openBuild = SELECTED_BUILD as Build | null,
}: {
  builds?: Build[];
  testRuns?: TestRun[];
  openBuild?: Build | null;
} = {}) => {
  if (openBuild) {
    vi.spyOn(buildsService, "getDetails").mockResolvedValue(openBuild);
  }
  const result = renderWithProviders(
    <SocketProvider>
      <SeedTestRuns testRuns={testRuns} />
      <Consumer builds={builds} />
    </SocketProvider>,
    { route: openBuild ? `/?buildId=${openBuild.id}` : "/" },
  );
  if (openBuild) {
    await vi.waitFor(() =>
      expect(screen.getByTestId("selectedBuild")).toHaveTextContent(
        `${openBuild.id}:${openBuild.status}`,
      ),
    );
    // the build is on screen, but the effect that re-subscribes the handlers
    // with it may still be pending; until it runs they see no open build
    await act(async () => {});
  }
  await vi.waitFor(() => expect(handlers.has("build_created")).toBe(true));
  // the open build shows before the provider's effect subscribes the handlers
  // that know it, and on a slow run an event emitted now met the old ones
  await act(async () => {});
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

    expect(socketIOClient).toHaveBeenCalledWith(API);
    expect([...handlers.keys()].sort()).toEqual([
      "build_created",
      "build_deleted",
      "build_updated",
      "testRun_created",
      "testRun_deleted",
      "testRun_updated",
    ]);
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

    // the selected build changed, so the handlers were registered again
    // against the new state, after the old ones were removed
    expect(fakeSocket.removeAllListeners.mock.calls.length).toBeGreaterThan(
      removalsBefore,
    );
    expect(handlers.size).toBe(6);
  });
});
