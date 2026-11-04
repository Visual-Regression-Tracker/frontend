import { act, screen } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { run } from "../../_helpers/testRun.fixture";
import { testRunService } from "../../services";
import { TestStatus } from "../../types";
import {
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
} from "../../_test/test.data.helper";
import {
  updateTestRun,
  useTestRunDispatch,
  useTestRunState,
} from "../../contexts";
import { AnalyseNoiseButton } from "./AnalyseNoiseButton";

const unresolved = (id: string) =>
  run({ id, name: id, status: TestStatus.unresolved });

const Connected = () => {
  const { testRuns } = useTestRunState();
  const dispatch = useTestRunDispatch();
  return (
    <>
      <AnalyseNoiseButton runs={testRuns} />
      <button
        onClick={() => {
          dispatch({ type: "get", payload: ["a", "b"].map(unresolved) });
        }}
      >
        Load
      </button>
      <button
        onClick={() => {
          updateTestRun(
            dispatch,
            ["a", "b"].map((id) => ({
              ...unresolved(id),
              noiseAnalysis: NOISE_ANALYSIS_PENDING,
            })),
          );
        }}
      >
        Mark pending
      </button>
    </>
  );
};

const button = () => screen.getByTestId("analyse-noise-button");

describe("AnalyseNoiseButton", () => {
  it("counts the unresolved runs in its label", () => {
    renderWithProviders(
      <AnalyseNoiseButton
        runs={[
          unresolved("a"),
          unresolved("b"),
          run({ id: "c", status: TestStatus.approved }),
        ]}
      />,
    );

    expect(button()).toHaveTextContent("Analyse unresolved (2)");
    expect(button()).toBeEnabled();
  });

  it("sends exactly the unresolved ids on click", async () => {
    const analyse = vi
      .spyOn(testRunService, "analyseNoise")
      .mockResolvedValue({ queued: 2, skipped: [] });
    const { user } = renderWithProviders(
      <AnalyseNoiseButton
        runs={[
          unresolved("a"),
          run({ id: "c", status: TestStatus.approved }),
          unresolved("b"),
        ]}
      />,
    );

    await user.click(button());

    expect(analyse).toHaveBeenCalledExactlyOnceWith(["a", "b"]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("is disabled when nothing is unresolved", () => {
    renderWithProviders(
      <AnalyseNoiseButton runs={[run({ id: "c", status: TestStatus.new })]} />,
    );

    expect(button()).toHaveTextContent("Analyse unresolved (0)");
    expect(button()).toBeDisabled();
  });

  it("shows the progress and is disabled while runs are pending", () => {
    renderWithProviders(
      <AnalyseNoiseButton
        runs={[
          { ...unresolved("a"), noiseAnalysis: NOISE_ANALYSIS_PENDING },
          { ...unresolved("b"), noiseAnalysis: NOISE_ANALYSIS_PENDING },
          { ...unresolved("c"), noiseAnalysis: NOISE_ANALYSIS_NOISE },
          unresolved("d"),
        ]}
      />,
    );

    expect(button()).toHaveTextContent("Analysing 2 of 4…");
    expect(button()).toBeDisabled();
  });

  it("updates the progress and re-enables when the results arrive", () => {
    const pending = (id: string) => ({
      ...unresolved(id),
      noiseAnalysis: NOISE_ANALYSIS_PENDING,
    });
    const { rerender } = renderWithProviders(
      <AnalyseNoiseButton runs={[pending("a"), pending("b")]} />,
    );
    expect(button()).toHaveTextContent("Analysing 2 of 2…");

    rerender(
      <AnalyseNoiseButton
        runs={[
          { ...unresolved("a"), noiseAnalysis: NOISE_ANALYSIS_NOISE },
          pending("b"),
        ]}
      />,
    );
    expect(button()).toHaveTextContent("Analysing 1 of 2…");

    rerender(
      <AnalyseNoiseButton
        runs={[
          { ...unresolved("a"), noiseAnalysis: NOISE_ANALYSIS_NOISE },
          { ...unresolved("b"), noiseAnalysis: NOISE_ANALYSIS_NOISE },
        ]}
      />,
    );
    expect(button()).toHaveTextContent("Analyse unresolved (2)");
    expect(button()).toBeEnabled();
  });

  it("does not warn when some runs were queued and the others were not unresolved", async () => {
    vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
      queued: 1,
      skipped: [{ id: "b", reason: "not unresolved" }],
    });
    const { user } = renderWithProviders(
      <AnalyseNoiseButton runs={[unresolved("a"), unresolved("b")]} />,
    );

    await user.click(button());

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  describe("after the request", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 2,
        skipped: [],
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const analyseLoaded = async () => {
      const { user } = renderWithProviders(<Connected />);
      await user.click(screen.getByText("Load"));
      await user.click(button());
      return user;
    };

    it("stays disabled until the runs show as pending, then shows the progress", async () => {
      const user = await analyseLoaded();

      expect(button()).toBeDisabled();
      expect(button()).toHaveTextContent("Analyse unresolved (2)");

      await user.click(screen.getByText("Mark pending"));

      expect(button()).toHaveTextContent("Analysing 2 of 2…");
      expect(button()).toBeDisabled();
    });

    it("is enabled again after three seconds without a pending event", async () => {
      await analyseLoaded();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(button()).toBeEnabled();
    });
  });

  it("warns when the queue is full", async () => {
    vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
      queued: 1,
      skipped: [{ id: "b", reason: "queue full" }],
    });
    const { user } = renderWithProviders(
      <AnalyseNoiseButton runs={[unresolved("a"), unresolved("b")]} />,
    );

    await user.click(button());

    expect(
      await screen.findByText("Queue is full, try again in a minute"),
    ).toBeInTheDocument();
  });

  it("says why when nothing was queued", async () => {
    vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
      queued: 0,
      skipped: [{ id: "a", reason: "not unresolved" }],
    });
    const { user } = renderWithProviders(
      <AnalyseNoiseButton runs={[unresolved("a")]} />,
    );

    await user.click(button());

    expect(
      await screen.findByText("Not analysed: not unresolved"),
    ).toBeInTheDocument();
  });

  it("shows the error when the request fails", async () => {
    vi.spyOn(testRunService, "analyseNoise").mockRejectedValue("Server error");
    const { user } = renderWithProviders(
      <AnalyseNoiseButton runs={[unresolved("a")]} />,
    );

    await user.click(button());

    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });
});
