import { useEffect } from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { SeedTestRuns } from "../_test/SeedTestRuns";
import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
  TEST_BUILD_UNRESOLVED,
  TEST_PROJECT,
  TEST_USER,
} from "../_test/test.data.helper";
import { run } from "../_helpers/testRun.fixture";
import { buildsService, projectsService, testRunService } from "../services";
import {
  selectProject,
  updateTestRun,
  useProjectDispatch,
  useProjectState,
  useTestRunDispatch,
} from "../contexts";
import { ImageComparison } from "../types/imageComparison";
import { TestRun, TestStatus } from "../types";
import BuildDetails from "./BuildDetails";
import { useSharedTestRunFilters } from "./TestRunList/TestRunFiltersContext";

const SelectProject = () => {
  const dispatch = useProjectDispatch();
  const { projectList, selectedProjectId } = useProjectState();
  useEffect(() => selectProject(dispatch, TEST_PROJECT.id), [dispatch]);
  return projectList.length > 0 && selectedProjectId === TEST_PROJECT.id ? (
    <div data-testid="project-ready" />
  ) : null;
};

const Deliver = ({ runs }: { runs: TestRun[] }) => {
  const dispatch = useTestRunDispatch();
  return <button onClick={() => updateTestRun(dispatch, runs)}>Deliver</button>;
};

const unresolved = (id: string, noiseAnalysis?: TestRun["noiseAnalysis"]) =>
  run({ id, status: TestStatus.unresolved, noiseAnalysis });

const renderDetails = async (
  runs: TestRun[],
  project = {},
  extra = <></>,
  build = TEST_BUILD_UNRESOLVED,
) => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue([
    { ...TEST_PROJECT, ...project },
  ]);
  vi.spyOn(buildsService, "getDetails").mockResolvedValue(build);
  const rendered = renderWithProviders(
    <>
      <SeedTestRuns testRuns={runs} />
      <SelectProject />
      {extra}
      <BuildDetails />
    </>,
    { user: TEST_USER, route: `/?buildId=${build.id}` },
  );
  await screen.findByTestId("project-ready");
  await screen.findByText("#3");
  return rendered;
};

const PROGRESS = /^Analysing \d+ of \d+…$/;

const openMenu = async (user: ReturnType<typeof renderWithProviders>["user"]) =>
  user.click(screen.getByRole("button", { name: "Build menu" }));

const counter = (name: RegExp) => screen.getByRole("button", { name });

describe("BuildDetails noise line", () => {
  it("shows the progress while unresolved runs are pending", async () => {
    await renderDetails([
      unresolved("a", NOISE_ANALYSIS_PENDING),
      unresolved("b", NOISE_ANALYSIS_PENDING),
      unresolved("c", NOISE_ANALYSIS_NOISE),
      unresolved("d"),
    ]);

    expect(await screen.findByText("Analysing 2 of 4…")).toBeInTheDocument();
  });

  it("disappears once the last pending run gets its analysis", async () => {
    const pending = unresolved("d", NOISE_ANALYSIS_PENDING);
    const { user } = await renderDetails(
      [pending],
      {},
      <Deliver runs={[{ ...pending, noiseAnalysis: NOISE_ANALYSIS_NOISE }]} />,
    );
    await screen.findByText("Analysing 1 of 1…");

    await user.click(screen.getByRole("button", { name: "Deliver" }));

    expect(screen.queryByText(PROGRESS)).not.toBeInTheDocument();
  });

  it("is absent when no run is pending", async () => {
    await renderDetails([
      unresolved("a", NOISE_ANALYSIS_NOISE),
      unresolved("b", NOISE_ANALYSIS_CHANGE),
    ]);

    expect(screen.queryByText(PROGRESS)).not.toBeInTheDocument();
  });

  it("is absent when the analysis is off in the project", async () => {
    await renderDetails([unresolved("a", NOISE_ANALYSIS_PENDING)], {
      imageComparison: ImageComparison.vlm,
    });

    expect(screen.queryByText(PROGRESS)).not.toBeInTheDocument();
  });
});

describe("BuildDetails status counters", () => {
  const runs = [
    run({ id: "a", status: TestStatus.unresolved }),
    run({ id: "b", status: TestStatus.unresolved }),
    run({ id: "c", status: TestStatus.approved }),
  ];

  it("counts the runs per status and hides the empty ones", async () => {
    await renderDetails(runs);

    expect(counter(/^All 3$/)).toBeEnabled();
    expect(counter(/^Unresolved 2$/)).toBeEnabled();
    expect(counter(/^Approved 1$/)).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: /^Failed/ }),
    ).not.toBeInTheDocument();
  });

  it("counts only the runs the name and tag filters leave", async () => {
    const SetFilters = () => {
      const { onNameChange, onTagFilterChange } = useSharedTestRunFilters();
      return (
        <button
          onClick={() => {
            onNameChange("screen");
            onTagFilterChange("os", ["iOS"]);
          }}
        >
          Set filters
        </button>
      );
    };
    const { user } = await renderDetails(
      [
        run({
          id: "a",
          name: "Screen 1",
          os: "iOS",
          status: TestStatus.unresolved,
        }),
        run({ id: "b", name: "Screen 2", os: "iOS", status: TestStatus.ok }),
        run({
          id: "c",
          name: "Screen 3",
          os: "Android",
          status: TestStatus.ok,
        }),
        run({ id: "d", name: "Login", os: "iOS", status: TestStatus.approved }),
      ],
      {},
      <SetFilters />,
    );

    await user.click(screen.getByRole("button", { name: "Set filters" }));

    expect(counter(/^All 2$/)).toBeVisible();
    expect(counter(/^Unresolved 1$/)).toBeVisible();
    expect(counter(/^Passed 1$/)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /^Approved/ }),
    ).not.toBeInTheDocument();
  });

  it("filters by several statuses and lets All clear them", async () => {
    const { user } = await renderDetails(runs);

    await user.click(counter(/^Unresolved 2$/));
    await user.click(counter(/^Approved 1$/));
    expect(counter(/^Unresolved 2$/)).toHaveAttribute("aria-pressed", "true");
    expect(counter(/^Approved 1$/)).toHaveAttribute("aria-pressed", "true");
    expect(counter(/^All 3$/)).toHaveAttribute("aria-pressed", "false");

    await user.click(counter(/^All 3$/));
    expect(counter(/^Unresolved 2$/)).toHaveAttribute("aria-pressed", "false");
    expect(counter(/^All 3$/)).toHaveAttribute("aria-pressed", "true");
  });
});

describe("BuildDetails menu", () => {
  const item = () => screen.getByRole("menuitem", { name: /^Analyse noise/ });

  it("analyses the unresolved runs the filters leave", async () => {
    const analyse = vi
      .spyOn(testRunService, "analyseNoise")
      .mockResolvedValue({ queued: 1, skipped: [] });
    const { user } = await renderDetails([
      unresolved("a"),
      unresolved("b"),
      run({ id: "c", status: TestStatus.approved }),
    ]);
    await user.click(counter(/^Unresolved 2$/));
    await openMenu(user);
    expect(item()).toHaveTextContent("Analyse noise (2)");

    await user.click(item());

    expect(analyse).toHaveBeenCalledExactlyOnceWith(["a", "b"]);
  });

  it("disables the item when nothing is unresolved", async () => {
    const { user } = await renderDetails([
      run({ id: "c", status: TestStatus.approved }),
    ]);

    await openMenu(user);

    expect(item()).toHaveAttribute("aria-disabled", "true");
  });

  it("disables the item while runs are pending", async () => {
    const { user } = await renderDetails([
      unresolved("a", NOISE_ANALYSIS_PENDING),
    ]);

    await openMenu(user);

    expect(item()).toHaveAttribute("aria-disabled", "true");
  });

  it("offers no analysis when it is off in the project", async () => {
    const { user } = await renderDetails([unresolved("a")], {
      imageComparison: ImageComparison.vlm,
    });

    await openMenu(user);

    expect(
      screen.queryByRole("menuitem", { name: /^Analyse noise/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Edit CI build id…" }),
    ).toBeVisible();
  });

  it("offers Stop build only for a running build", async () => {
    const { user } = await renderDetails([]);

    await openMenu(user);

    expect(
      screen.queryByRole("menuitem", { name: "Stop build" }),
    ).not.toBeInTheDocument();
  });
});

describe("BuildDetails progress", () => {
  it("shows a progress bar while the build runs", async () => {
    await renderDetails([], {}, <></>, {
      ...TEST_BUILD_UNRESOLVED,
      isRunning: true,
    });

    expect(await screen.findByRole("progressbar")).toBeVisible();
  });

  it("shows no progress bar once the build is done", async () => {
    await renderDetails([]);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
