import { useEffect } from "react";
import { act, screen } from "@testing-library/react";
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

const renderDetails = async (runs: TestRun[], project = {}, extra = <></>) => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue([
    { ...TEST_PROJECT, ...project },
  ]);
  vi.spyOn(buildsService, "getDetails").mockResolvedValue(
    TEST_BUILD_UNRESOLVED,
  );
  const getNoiseSummary = vi
    .spyOn(buildsService, "getNoiseSummary")
    .mockRejectedValue(new Error("no summary"));
  const rendered = renderWithProviders(
    <>
      <SeedTestRuns testRuns={runs} />
      <SelectProject />
      {extra}
      <BuildDetails />
    </>,
    { user: TEST_USER, route: `/?buildId=${TEST_BUILD_UNRESOLVED.id}` },
  );
  await screen.findByTestId("project-ready");
  await screen.findByText("#3");
  return { ...rendered, getNoiseSummary };
};

const NoiseHintsProbe = () => (
  <output data-testid="noise-hints">
    {useSharedTestRunFilters().noiseHints.join(",")}
  </output>
);

const CAPTION = /unresolved look like rendering noise/;

const openMenu = async (user: ReturnType<typeof renderWithProviders>["user"]) =>
  user.click(screen.getByRole("button", { name: "Build menu" }));

const counter = (name: RegExp) => screen.getByRole("button", { name });

describe("BuildDetails noise caption", () => {
  it("counts noise and analysed runs among the unresolved ones", async () => {
    await renderDetails([
      unresolved("a", NOISE_ANALYSIS_NOISE),
      unresolved("b", NOISE_ANALYSIS_NOISE),
      unresolved("c", NOISE_ANALYSIS_CHANGE),
      unresolved("d"),
    ]);

    expect(
      await screen.findByText(
        "2 of 4 unresolved look like rendering noise · analysed 3 of 4",
      ),
    ).toBeInTheDocument();
  });

  it("follows the runs when one of them gets its analysis", async () => {
    const pending = unresolved("d", NOISE_ANALYSIS_PENDING);
    const { user } = await renderDetails(
      [pending],
      {},
      <Deliver runs={[{ ...pending, noiseAnalysis: NOISE_ANALYSIS_NOISE }]} />,
    );
    await screen.findByText("Analysing 1 of 1…");

    await user.click(screen.getByRole("button", { name: "Deliver" }));

    expect(
      await screen.findByText(
        "1 of 1 unresolved look like rendering noise · analysed 1 of 1",
      ),
    ).toBeInTheDocument();
  });

  it("is absent when no run is unresolved", async () => {
    await renderDetails([
      run({ id: "a", status: TestStatus.approved }),
      run({ id: "b", status: TestStatus.new }),
    ]);

    expect(screen.queryByText(CAPTION)).not.toBeInTheDocument();
  });

  it("is absent when the analysis is off in the project", async () => {
    await renderDetails([unresolved("a", NOISE_ANALYSIS_NOISE)], {
      imageComparison: ImageComparison.vlm,
    });

    expect(screen.queryByText(CAPTION)).not.toBeInTheDocument();
  });

  it("does not ask for the build summary when the analysis is off in the project", async () => {
    const { getNoiseSummary } = await renderDetails(
      [unresolved("a", NOISE_ANALYSIS_NOISE)],
      { imageComparison: ImageComparison.vlm },
    );

    await act(() => Promise.resolve());
    expect(getNoiseSummary).not.toHaveBeenCalled();
  });
});

describe("BuildDetails noise line", () => {
  it("shows the progress while runs are pending, without the caption", async () => {
    await renderDetails([
      unresolved("a", NOISE_ANALYSIS_PENDING),
      unresolved("b", NOISE_ANALYSIS_PENDING),
      unresolved("c", NOISE_ANALYSIS_NOISE),
      unresolved("d"),
    ]);

    expect(await screen.findByText("Analysing 2 of 4…")).toBeInTheDocument();
    expect(screen.queryByText(CAPTION)).not.toBeInTheDocument();
  });

  it("offers no Show them when no unresolved run looks like noise", async () => {
    await renderDetails([unresolved("a", NOISE_ANALYSIS_CHANGE)]);

    await screen.findByText(CAPTION);
    expect(
      screen.queryByRole("button", { name: "Show them" }),
    ).not.toBeInTheDocument();
  });

  it("sets the noise filter to likely noise from Show them", async () => {
    const { user } = await renderDetails(
      [
        unresolved("a", NOISE_ANALYSIS_NOISE),
        unresolved("b", NOISE_ANALYSIS_CHANGE),
      ],
      {},
      <NoiseHintsProbe />,
    );
    expect(screen.getByTestId("noise-hints")).toBeEmptyDOMElement();

    await user.click(await screen.findByRole("button", { name: "Show them" }));

    expect(screen.getByTestId("noise-hints")).toHaveTextContent("Likely noise");
  });

  it("is absent when the analysis is off in the project", async () => {
    await renderDetails([unresolved("a", NOISE_ANALYSIS_NOISE)], {
      imageComparison: ImageComparison.vlm,
    });

    expect(
      screen.queryByRole("button", { name: "Show them" }),
    ).not.toBeInTheDocument();
  });
});

describe("BuildDetails status counters", () => {
  const runs = [
    run({ id: "a", status: TestStatus.unresolved }),
    run({ id: "b", status: TestStatus.unresolved }),
    run({ id: "c", status: TestStatus.approved }),
  ];

  it("counts the runs per status and leaves the empty ones inactive", async () => {
    await renderDetails(runs);

    expect(counter(/^All 3$/)).toBeEnabled();
    expect(counter(/^Unresolved 2$/)).toBeEnabled();
    expect(counter(/^Approved 1$/)).toBeEnabled();
    expect(counter(/^Failed 0$/)).toHaveAttribute("aria-disabled", "true");
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
  const item = () =>
    screen.getByRole("menuitem", { name: /^Analyse rendering noise/ });

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
    expect(item()).toHaveTextContent("Analyse rendering noise (2)");

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
      screen.queryByRole("menuitem", { name: /^Analyse rendering noise/ }),
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
