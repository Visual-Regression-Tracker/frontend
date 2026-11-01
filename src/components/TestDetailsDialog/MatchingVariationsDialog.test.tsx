import { type ReactNode, useEffect } from "react";
import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate } from "react-router-dom";
import { renderWithProviders } from "../../_test/render";
import { SeedTestRuns } from "../../_test/SeedTestRuns";
import { buildsService, projectsService, testRunService } from "../../services";
import { MatchingVariations } from "../../services/testRun.service";
import {
  selectProject,
  useProjectDispatch,
  useProjectState,
  useTestRunDispatch,
} from "../../contexts";
import { GO_TO_NEXT_KEY } from "../../constants";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import { TestRun, TestStatus } from "../../types";
import {
  TEST_BUILD_UNRESOLVED,
  TEST_PROJECT,
  TEST_USER,
  testRunMock,
} from "../../_test/test.data.helper";
import { TestDetailsDialog } from ".";
import {
  MatchingVariationsDialog,
  MatchingVariationsMode,
} from "./MatchingVariationsDialog";
import { allSucceeded } from "../../_test/bulkResult";
import { CurrentSearch, currentSearch } from "../../_test/location";

// Konva needs the native canvas package under Node, which jsdom has not got
vi.mock("./DrawArea", () => import("../../_test/FakeDrawArea"));

// the acted-on set is module-level and outlives a test: each test gets a build of its own
let buildCounter = 0;
const nextBuildId = () => `matching-build-${++buildCounter}`;

const run = (
  id: string,
  buildId: string,
  changes: Partial<TestRun> = {},
): TestRun => ({
  ...testRunMock,
  id,
  buildId,
  name: "login screen",
  customTags: `tags ${id}`,
  status: TestStatus.unresolved,
  merge: false,
  ...changes,
});

const skippedRun = (
  id: string,
  buildId: string,
): TestRun & { reason: string } => ({
  ...run(id, buildId),
  reason: "different change",
});

type RunsDispatch = ReturnType<typeof useTestRunDispatch>;
type RunsAction = Parameters<RunsDispatch>[0];

const WithNavigation = ({
  buildId,
  children,
}: {
  buildId: string;
  children: (navigateTo: (id: string) => void) => ReactNode;
}) => {
  const navigate = useNavigate();
  return children((id) => {
    navigate(buildTestRunLocation(buildId, id));
  });
};

const DispatchHandle = ({
  onDispatch,
}: {
  onDispatch: (dispatch: RunsDispatch) => void;
}) => {
  const dispatch = useTestRunDispatch();
  useEffect(() => onDispatch(dispatch), [dispatch, onDispatch]);
  return null;
};

const searchOf = (buildId: string, testId: string) =>
  `?buildId=${buildId}&testId=${testId}`;

const checkbox = (id: string) =>
  screen.getByRole("checkbox", { name: `tags ${id}` });
const submitButton = (count: number) =>
  screen.getByRole("button", { name: `Approve ${count} selected` });

// user-event waits on timers, which are fake here
const newReviewer = () =>
  userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

const elapse = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

interface RenderOptions {
  buildId: string;
  current: TestRun;
  testRuns?: TestRun[];
  answer?: MatchingVariations;
  mode?: MatchingVariationsMode;
}

const renderDialog = async ({
  buildId,
  current,
  testRuns = [current],
  answer = { variations: [], skipped: [] },
  mode = "approve",
}: RenderOptions) => {
  const state = { answer };
  vi.spyOn(buildsService, "getDetails").mockResolvedValue({
    ...TEST_BUILD_UNRESOLVED,
    id: buildId,
  });
  vi.spyOn(testRunService, "getMatchingVariations").mockImplementation(() =>
    Promise.resolve(state.answer),
  );
  vi.spyOn(testRunService, "approveBulk").mockImplementation(allSucceeded);
  vi.spyOn(testRunService, "rejectBulk").mockImplementation(allSucceeded);

  const onClose = vi.fn();
  let dispatchRuns: RunsDispatch | undefined;
  const result = renderWithProviders(
    <>
      <SeedTestRuns testRuns={testRuns} />
      <DispatchHandle onDispatch={(dispatch) => (dispatchRuns = dispatch)} />
      <CurrentSearch />
      <WithNavigation buildId={buildId}>
        {(navigateTo) => (
          <MatchingVariationsDialog
            mode={mode}
            testRun={current}
            onClose={onClose}
            navigateTo={navigateTo}
          />
        )}
      </WithNavigation>
    </>,
    { route: `/?buildId=${buildId}`, user: TEST_USER },
  );
  // the build is what the navigation after a submit is built from
  await waitFor(() =>
    expect(buildsService.getDetails).toHaveBeenCalledWith(buildId),
  );
  await screen.findByText("Click a thumbnail to view it full-size.");
  return {
    ...result,
    onClose,
    setAnswer: (next: MatchingVariations) => {
      state.answer = next;
    },
    dispatchRuns: (action: RunsAction) =>
      act(async () => {
        dispatchRuns?.(action);
        await Promise.resolve();
      }),
  };
};

describe("MatchingVariationsDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.removeItem(GO_TO_NEXT_KEY);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem(GO_TO_NEXT_KEY);
  });

  it("starts with the matching variations selected and the skipped ones not", async () => {
    const buildId = nextBuildId();
    const current = run("current", buildId);
    await renderDialog({
      buildId,
      current,
      answer: {
        variations: [run("v1", buildId), run("v2", buildId)],
        skipped: [skippedRun("s1", buildId)],
      },
    });

    expect(checkbox("v1")).toBeChecked();
    expect(checkbox("v2")).toBeChecked();
    expect(checkbox("s1")).not.toBeChecked();
    expect(screen.getByText("2 of 2 matching selected")).toBeVisible();
    expect(submitButton(2)).toBeEnabled();
    expect(
      screen.getByText("1 didn't match — review separately"),
    ).toBeVisible();
    expect(testRunService.getMatchingVariations).toHaveBeenCalledWith(
      current.id,
    );
  });

  describe("background refresh", () => {
    it("keeps the reviewer's ticks and lists the matches that arrived since", async () => {
      const buildId = nextBuildId();
      const current = run("current", buildId);
      const sibling = run("sibling", buildId);
      const v1 = run("v1", buildId);
      const v2 = run("v2", buildId);
      const { setAnswer, dispatchRuns } = await renderDialog({
        buildId,
        current,
        testRuns: [current, sibling],
        answer: {
          variations: [v1, v2],
          skipped: [skippedRun("s1", buildId)],
        },
      });
      // seeding the list changes the group once; let that refresh pass
      await elapse(1600);
      vi.mocked(testRunService.getMatchingVariations).mockClear();

      const reviewer = newReviewer();
      await reviewer.click(checkbox("v2"));
      await reviewer.click(checkbox("s1"));
      expect(checkbox("v2")).not.toBeChecked();
      expect(checkbox("s1")).toBeChecked();

      setAnswer({
        variations: [v1, v2, run("v3", buildId)],
        skipped: [skippedRun("s1", buildId)],
      });
      await dispatchRuns({
        type: "update",
        payload: [{ ...sibling, status: TestStatus.approved }],
      });
      expect(testRunService.getMatchingVariations).not.toHaveBeenCalled();
      await elapse(1600);

      expect(testRunService.getMatchingVariations).toHaveBeenCalledTimes(1);
      expect(await screen.findByText("tags v3")).toBeVisible();
      expect(checkbox("v3")).toBeChecked();
      expect(screen.getByText("2 of 3 matching selected")).toBeVisible();
      expect(checkbox("v1")).toBeChecked();
      expect(checkbox("v2")).not.toBeChecked();
      expect(checkbox("s1")).toBeChecked();
    });

    it("drops the ticks of runs that are no longer listed", async () => {
      const buildId = nextBuildId();
      const current = run("current", buildId);
      const sibling = run("sibling", buildId);
      const v1 = run("v1", buildId);
      const { setAnswer, dispatchRuns } = await renderDialog({
        buildId,
        current,
        testRuns: [current, sibling],
        answer: { variations: [v1, run("v2", buildId)], skipped: [] },
      });
      await elapse(1600);

      setAnswer({ variations: [v1], skipped: [] });
      await dispatchRuns({
        type: "update",
        payload: [{ ...sibling, status: TestStatus.approved }],
      });
      await elapse(1600);

      await waitFor(() =>
        expect(screen.getByText("1 of 1 matching selected")).toBeVisible(),
      );
      expect(screen.queryByText("tags v2")).not.toBeInTheDocument();
      expect(submitButton(1)).toBeEnabled();
    });
  });

  describe("submitting", () => {
    it("keeps the dialog open and shows an error toast when the request fails", async () => {
      const buildId = nextBuildId();
      const current = run("current", buildId);
      const { onClose } = await renderDialog({
        buildId,
        current,
        answer: {
          variations: [run("v1", buildId), run("v2", buildId)],
          skipped: [],
        },
      });
      vi.mocked(testRunService.approveBulk).mockRejectedValue("Approve failed");
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      const reviewer = newReviewer();

      await reviewer.click(submitButton(2));

      expect(await screen.findByText("Approve failed")).toBeVisible();
      expect(testRunService.approveBulk).toHaveBeenCalledWith(
        ["v1", "v2"],
        false,
      );
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.queryByText("Approving 2 variations…")).toBeNull();
      expect(submitButton(2)).toBeEnabled();
      expect(checkbox("v1")).toBeChecked();
      expect(currentSearch()).toBe(`?buildId=${buildId}`);
    });

    it("shows an error toast for a failed rejection too", async () => {
      const buildId = nextBuildId();
      const current = run("current", buildId);
      const { onClose } = await renderDialog({
        buildId,
        current,
        mode: "reject",
        answer: { variations: [run("v1", buildId)], skipped: [] },
      });
      vi.mocked(testRunService.rejectBulk).mockRejectedValue("Reject failed");
      const reviewer = newReviewer();

      await reviewer.click(
        screen.getByRole("button", { name: "Reject 1 selected" }),
      );

      expect(await screen.findByText("Reject failed")).toBeVisible();
      expect(testRunService.rejectBulk).toHaveBeenCalledWith(["v1"]);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("tells the user how many were approved when some failed, and leaves the screen where it is", async () => {
      const buildId = nextBuildId();
      const current = run("current", buildId);
      const { onClose } = await renderDialog({
        buildId,
        current,
        answer: {
          variations: [
            run("v1", buildId),
            run("v2", buildId),
            run("v3", buildId),
          ],
          skipped: [],
        },
      });
      vi.mocked(testRunService.approveBulk).mockResolvedValue({
        succeeded: ["v1", "v2"],
        failed: [{ id: "v3", message: "Baseline is gone" }],
      });
      localStorage.setItem(GO_TO_NEXT_KEY, "true");

      await newReviewer().click(submitButton(3));

      const toast = await screen.findByText(
        "Approved 2 of 3 variations. 1 failed: Baseline is gone",
      );
      expect(toast.closest(".notistack-MuiContent")).toHaveClass(
        "notistack-MuiContent-warning",
      );
      expect(screen.queryByText("Approved 3 variations")).toBeNull();
      expect(onClose).toHaveBeenCalledTimes(1);
      await elapse(0);
      expect(currentSearch()).toBe(`?buildId=${buildId}`);
    });

    it("keeps the dialog open and the ticks when every run failed", async () => {
      const buildId = nextBuildId();
      const current = run("current", buildId);
      const { onClose } = await renderDialog({
        buildId,
        current,
        answer: {
          variations: [run("v1", buildId), run("v2", buildId)],
          skipped: [],
        },
      });
      vi.mocked(testRunService.approveBulk).mockResolvedValue({
        succeeded: [],
        failed: [
          { id: "v1", message: "Baseline is gone" },
          { id: "v2", message: "Baseline is gone" },
        ],
      });

      await newReviewer().click(submitButton(2));

      expect(
        await screen.findByText(
          "Approved 0 of 2 variations. 2 failed: Baseline is gone",
        ),
      ).toBeVisible();
      expect(onClose).not.toHaveBeenCalled();
      expect(submitButton(2)).toBeEnabled();
      expect(checkbox("v1")).toBeChecked();
    });

    it("tells the user how many were rejected when some failed", async () => {
      const buildId = nextBuildId();
      const current = run("current", buildId);
      const { onClose } = await renderDialog({
        buildId,
        current,
        mode: "reject",
        answer: {
          variations: [run("v1", buildId), run("v2", buildId)],
          skipped: [],
        },
      });
      vi.mocked(testRunService.rejectBulk).mockResolvedValue({
        succeeded: ["v1"],
        failed: [{ id: "v2", message: "Run is locked" }],
      });

      await newReviewer().click(
        screen.getByRole("button", { name: "Reject 2 selected" }),
      );

      expect(
        await screen.findByText(
          "Rejected 1 of 2 variations. 1 failed: Run is locked",
        ),
      ).toBeVisible();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("sends the ticked runs with the merge flag, closes and confirms", async () => {
      const buildId = nextBuildId();
      const current = run("current", buildId, { merge: true });
      const { onClose } = await renderDialog({
        buildId,
        current,
        answer: {
          variations: [run("v1", buildId), run("v2", buildId)],
          skipped: [skippedRun("s1", buildId)],
        },
      });
      const reviewer = newReviewer();

      await reviewer.click(checkbox("v2"));
      await reviewer.click(checkbox("s1"));
      await reviewer.click(submitButton(2));

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(testRunService.approveBulk).toHaveBeenCalledWith(
        ["v1", "s1"],
        true,
      );
      expect(await screen.findByText("Approved 2 variations")).toBeVisible();
      expect(currentSearch()).toBe(`?buildId=${buildId}`);
    });
  });

  describe("go to the next", () => {
    const runsOf = (buildId: string) => [
      run("a", buildId),
      run("b", buildId, { status: TestStatus.approved }),
      run("c", buildId),
      run("d", buildId),
    ];

    const approveAndSeeWhereItGoes = async (
      buildId: string,
      openId: string,
      selectedIds: string[],
      prepare?: (
        dispatchRuns: (action: RunsAction) => Promise<void>,
      ) => Promise<void>,
    ): Promise<string | null> => {
      const testRuns = runsOf(buildId);
      const { onClose, dispatchRuns } = await renderDialog({
        buildId,
        current: testRuns.find((item) => item.id === openId) as TestRun,
        testRuns,
        answer: {
          variations: selectedIds.map((id) => run(id, buildId)),
          skipped: [],
        },
      });
      await prepare?.(dispatchRuns);
      localStorage.setItem(GO_TO_NEXT_KEY, "true");

      await newReviewer().click(submitButton(selectedIds.length));

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      // the router applies a navigation as a transition: let it render
      await elapse(0);
      const search = currentSearch() ?? "";
      return search.startsWith(`?buildId=${buildId}&testId=`)
        ? search.slice(`?buildId=${buildId}&testId=`.length)
        : null;
    };

    it("opens the next unresolved run after the open one", async () => {
      const where = await approveAndSeeWhereItGoes(nextBuildId(), "a", ["x"]);

      expect(where).toBe("c");
    });

    it("wraps round to an earlier unresolved run from the last one", async () => {
      const where = await approveAndSeeWhereItGoes(nextBuildId(), "d", ["x"]);

      expect(where).toBe("a");
    });

    it("skips the runs it has just approved, although the list still shows them unresolved", async () => {
      const where = await approveAndSeeWhereItGoes(nextBuildId(), "d", [
        "a",
        "x",
      ]);

      expect(where).toBe("c");
    });

    it("keeps skipping the runs of an earlier batch of the same build", async () => {
      const buildId = nextBuildId();
      await approveAndSeeWhereItGoes(buildId, "d", ["a"]);
      cleanup();

      const where = await approveAndSeeWhereItGoes(buildId, "d", ["x"]);

      expect(where).toBe("c");
    });

    it("does not carry the acted runs over to another build", async () => {
      await approveAndSeeWhereItGoes(nextBuildId(), "d", ["a"]);
      cleanup();

      const where = await approveAndSeeWhereItGoes(nextBuildId(), "d", ["x"]);

      expect(where).toBe("a");
    });

    it("follows the order of the filtered, sorted list and ignores runs filtered out", async () => {
      const where = await approveAndSeeWhereItGoes(
        nextBuildId(),
        "d",
        ["x"],
        (dispatchRuns) =>
          dispatchRuns({ type: "filterSort", payload: ["d", "c", "a"] }),
      );

      expect(where).toBe("c");
    });

    it("stays on the screen when nothing unresolved is left", async () => {
      const buildId = nextBuildId();
      const testRuns = [
        run("a", buildId, { status: TestStatus.approved }),
        run("b", buildId, { status: TestStatus.approved }),
      ];
      const { onClose } = await renderDialog({
        buildId,
        current: testRuns[0],
        testRuns,
        answer: { variations: [run("x", buildId)], skipped: [] },
      });
      localStorage.setItem(GO_TO_NEXT_KEY, "true");

      await newReviewer().click(submitButton(1));

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(currentSearch()).toBe(`?buildId=${buildId}`);
      expect(await screen.findByText("Approved 1 variation")).toBeVisible();
    });

    it("does not mark a failed batch as acted", async () => {
      const buildId = nextBuildId();
      const testRuns = runsOf(buildId);
      const { onClose } = await renderDialog({
        buildId,
        current: testRuns[3],
        testRuns,
        answer: {
          variations: [run("a", buildId), run("x", buildId)],
          skipped: [],
        },
      });
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      const reviewer = newReviewer();
      vi.mocked(testRunService.approveBulk).mockRejectedValueOnce("nope");
      await reviewer.click(submitButton(2));
      await screen.findByText("nope");

      await reviewer.click(checkbox("a"));
      await reviewer.click(submitButton(1));

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(testRunService.approveBulk).toHaveBeenLastCalledWith(["x"], false);
      await elapse(0);
      expect(currentSearch()).toBe(searchOf(buildId, "a"));
    });

    it("marks only the runs that went through as acted", async () => {
      const buildId = nextBuildId();
      const testRuns = runsOf(buildId);
      const { onClose } = await renderDialog({
        buildId,
        current: testRuns[3],
        testRuns,
        answer: {
          variations: [run("a", buildId), run("x", buildId)],
          skipped: [],
        },
      });
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      const reviewer = newReviewer();
      vi.mocked(testRunService.approveBulk).mockResolvedValueOnce({
        succeeded: ["x"],
        failed: [{ id: "a", message: "Baseline is gone" }],
      });
      await reviewer.click(submitButton(2));
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

      await reviewer.click(checkbox("a"));
      await reviewer.click(submitButton(1));

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(2));
      await elapse(0);
      expect(currentSearch()).toBe(searchOf(buildId, "a"));
    });
  });

  describe("inside the details dialog", () => {
    const SelectProject = () => {
      const dispatch = useProjectDispatch();
      const { projectList, selectedProjectId } = useProjectState();
      useEffect(() => selectProject(dispatch, TEST_PROJECT.id), [dispatch]);
      return projectList.length > 0 && selectedProjectId === TEST_PROJECT.id ? (
        <div data-testid="project-ready" />
      ) : null;
    };

    const openDetails = async (buildId: string) => {
      const current = run("current", buildId, { name: "details screen" });
      const testRuns = [
        current,
        run("v1", buildId, { name: "details screen" }),
        run("next", buildId, { name: "other screen" }),
      ];
      vi.spyOn(projectsService, "getAll").mockResolvedValue([
        { ...TEST_PROJECT, bulkApproveVariations: true },
      ]);
      vi.spyOn(buildsService, "getDetails").mockResolvedValue({
        ...TEST_BUILD_UNRESOLVED,
        id: buildId,
      });
      vi.spyOn(testRunService, "getDetails").mockImplementation(async (id) => {
        const found = testRuns.find((item) => item.id === id);
        if (!found) throw new Error(`no run ${id}`);
        return found;
      });
      vi.spyOn(testRunService, "getMatchingVariations").mockResolvedValue({
        variations: [run("v1", buildId)],
        skipped: [],
      });
      vi.spyOn(testRunService, "approveBulk").mockImplementation(allSucceeded);
      vi.spyOn(testRunService, "rejectBulk").mockImplementation(allSucceeded);

      const result = renderWithProviders(
        <>
          <SeedTestRuns testRuns={testRuns} />
          <SelectProject />
          <CurrentSearch />
          <TestDetailsDialog />
        </>,
        { route: `/${searchOf(buildId, "current")}`, user: TEST_USER },
      );
      await screen.findByTestId("project-ready");
      await waitFor(() =>
        expect(buildsService.getDetails).toHaveBeenCalledWith(buildId),
      );
      const user = newReviewer();
      const openVariations = async (label: string) => {
        await user.click(
          await screen.findByText(label, { selector: "button" }),
        );
      };
      return { ...result, user, openVariations };
    };

    it("shows the review again when variations are rejected after they were approved", async () => {
      const { user, openVariations } = await openDetails(nextBuildId());
      await openVariations("Approve variations");
      await user.click(
        await screen.findByRole("button", { name: "Approve 1 selected" }),
      );
      await screen.findByText("Approved 1 variation");
      await waitFor(() =>
        expect(
          screen.queryByText("Approve variations — review before applying"),
        ).not.toBeInTheDocument(),
      );

      await openVariations("Reject variations");

      expect(
        await screen.findByRole("button", { name: "Reject 1 selected" }),
      ).toBeEnabled();
      expect(screen.queryByText("Rejecting 1 variation…")).toBeNull();
    });

    it("asks about unsaved ignore areas before going to the next run after approving variations", async () => {
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      const buildId = nextBuildId();
      const { user, openVariations } = await openDetails(buildId);
      await user.click(
        await screen.findByRole("button", { name: "Draw an area" }),
      );
      await openVariations("Approve variations");
      await user.click(
        await screen.findByRole("button", { name: "Approve 1 selected" }),
      );

      expect(
        await screen.findByText("You have not saved ignore areas"),
      ).toBeVisible();
      expect(currentSearch()).toBe(searchOf(buildId, "current"));

      await user.click(screen.getByRole("button", { name: "Discard" }));

      await waitFor(() =>
        expect(currentSearch()).toBe(searchOf(buildId, "next")),
      );
    });
  });
});
