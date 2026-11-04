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
import { buildsService, projectsService } from "../services";
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
  vi.spyOn(buildsService, "getNoiseSummary").mockRejectedValue(
    new Error("no summary"),
  );
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
  return rendered;
};

const CAPTION = /unresolved look like rendering noise/;

describe("BuildDetails noise caption", () => {
  it("counts noise and analysed runs among the unresolved ones", async () => {
    await renderDetails([
      unresolved("a", NOISE_ANALYSIS_NOISE),
      unresolved("b", NOISE_ANALYSIS_NOISE),
      unresolved("c", NOISE_ANALYSIS_CHANGE),
      unresolved("d", NOISE_ANALYSIS_PENDING),
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
    await screen.findByText(
      "0 of 1 unresolved look like rendering noise · analysed 0 of 1",
    );

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
});
