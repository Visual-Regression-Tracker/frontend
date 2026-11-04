import { useEffect } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { SeedTestRuns } from "../_test/SeedTestRuns";
import {
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
  NOISE_SUMMARY,
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
import { TestRun, TestStatus } from "../types";
import { NoiseBanner } from "./NoiseBanner";

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

const pendingRun = run({
  id: "p",
  status: TestStatus.unresolved,
  noiseAnalysis: NOISE_ANALYSIS_PENDING,
});

const banner = () => screen.queryByTestId("noise-banner");

const renderBanner = async ({
  summary = () => Promise.resolve(NOISE_SUMMARY),
  runs = [] as TestRun[],
  buildId = TEST_BUILD_UNRESOLVED.id,
} = {}) => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue([TEST_PROJECT]);
  vi.spyOn(buildsService, "getDetails").mockImplementation((id) =>
    Promise.resolve({ ...TEST_BUILD_UNRESOLVED, id }),
  );
  const getNoiseSummary = vi
    .spyOn(buildsService, "getNoiseSummary")
    .mockImplementation(summary);
  const rendered = renderWithProviders(
    <>
      <SeedTestRuns testRuns={runs} />
      <SelectProject />
      <Deliver
        runs={[{ ...pendingRun, noiseAnalysis: NOISE_ANALYSIS_NOISE }]}
      />
      <NoiseBanner />
    </>,
    { user: TEST_USER, route: `/?buildId=${buildId}` },
  );
  await screen.findByTestId("project-ready");
  return { ...rendered, getNoiseSummary };
};

describe("NoiseBanner", () => {
  it("asks for the summary of the selected build once", async () => {
    const { getNoiseSummary } = await renderBanner();

    expect(await screen.findByTestId("noise-banner")).toBeInTheDocument();
    expect(getNoiseSummary).toHaveBeenCalledExactlyOnceWith(
      TEST_BUILD_UNRESOLVED.id,
    );
  });

  it("shows the renderer change text as an info alert without buttons", async () => {
    await renderBanner({
      summary: () =>
        Promise.resolve({
          ...NOISE_SUMMARY,
          unresolved: 34,
          analysed: 34,
          noiseLike: 34,
          byEnvironment: [NOISE_SUMMARY.byEnvironment[0]],
        }),
    });

    const alert = await screen.findByTestId("noise-banner");
    expect(alert).toHaveAttribute("role", "alert");
    expect(alert).toHaveTextContent(
      "Chrome runs look like a renderer change: 34 of 34 diffs are rendering noise (usually 10 % in this project). Filter likely noise and review them in one pass",
    );
    expect(alert.querySelector("button")).toBeNull();
  });

  it("is hidden when the summary does not look like a renderer change", async () => {
    const { getNoiseSummary } = await renderBanner({
      summary: () => Promise.resolve({ ...NOISE_SUMMARY, noiseLike: 1 }),
    });

    await waitFor(() => expect(getNoiseSummary).toHaveBeenCalled());
    await act(() => Promise.resolve());
    expect(banner()).not.toBeInTheDocument();
  });

  it("is hidden without a message when the request fails", async () => {
    const { getNoiseSummary } = await renderBanner({
      summary: () => Promise.reject(new Error("boom")),
    });

    await waitFor(() => expect(getNoiseSummary).toHaveBeenCalled());
    await act(() => Promise.resolve());
    expect(banner()).not.toBeInTheDocument();
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });

  it("waits for the pending runs to finish before it asks", async () => {
    const { user, getNoiseSummary } = await renderBanner({
      runs: [pendingRun],
    });
    await act(() => Promise.resolve());
    expect(getNoiseSummary).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Deliver" }));

    await waitFor(() => expect(getNoiseSummary).toHaveBeenCalledTimes(1));
    expect(getNoiseSummary).toHaveBeenLastCalledWith(TEST_BUILD_UNRESOLVED.id);
    expect(await screen.findByTestId("noise-banner")).toBeInTheDocument();
  });

  it("does not ask again on a run update that leaves nothing pending", async () => {
    const { user, getNoiseSummary } = await renderBanner({
      runs: [{ ...pendingRun, noiseAnalysis: NOISE_ANALYSIS_NOISE }],
    });
    await screen.findByTestId("noise-banner");

    await user.click(screen.getByRole("button", { name: "Deliver" }));
    await act(() => Promise.resolve());

    expect(getNoiseSummary).toHaveBeenCalledTimes(1);
  });
});
