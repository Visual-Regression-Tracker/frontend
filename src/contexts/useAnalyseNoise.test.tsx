import { act } from "@testing-library/react";
import { renderHookWithProviders } from "../_test/render";
import { run } from "../_helpers/testRun.fixture";
import { testRunService } from "../services";
import { NOISE_ANALYSIS_NOISE } from "../_test/test.data.helper";
import { type TestRun, TestStatus } from "../types";
import {
  updateTestRun,
  useTestRunDispatch,
  useTestRunState,
} from "./testRun.context";
import { isNoisePending } from "../_helpers/noiseHint.helper";
import { useAnalyseNoise } from "./useAnalyseNoise";

const unresolved = (id: string) =>
  run({ id, name: id, status: TestStatus.unresolved });

const setup = () => {
  const enqueue = vi.fn();
  const hook = renderHookWithProviders(() => ({
    ...useAnalyseNoise(enqueue),
    dispatch: useTestRunDispatch(),
  }));
  return { enqueue, ...hook };
};

describe("useAnalyseNoise", () => {
  describe("warnings", () => {
    it("stays quiet when only some runs were skipped for a reason the user cannot act on", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 49,
        skipped: [{ id: "b", reason: "not unresolved" }],
      });
      const { enqueue, result } = setup();

      await act(async () => {
        await result.current.analyse(["a", "b"]);
      });

      expect(enqueue).not.toHaveBeenCalled();
    });

    it("warns that the queue is full when some runs were queued and some were not", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 49,
        skipped: [
          { id: "b", reason: "not unresolved" },
          { id: "c", reason: "queue full" },
        ],
      });
      const { enqueue, result } = setup();

      await act(async () => {
        await result.current.analyse(["a", "b", "c"]);
      });

      expect(enqueue).toHaveBeenCalledExactlyOnceWith(
        "Queue is full, try again in a minute",
        { variant: "warning" },
      );
    });

    it("says the queue is full, not the first reason, when nothing was queued and the queue was full", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 0,
        skipped: [
          { id: "a", reason: "not unresolved" },
          { id: "b", reason: "queue full" },
        ],
      });
      const { enqueue, result } = setup();

      await act(async () => {
        await result.current.analyse(["a", "b"]);
      });

      expect(enqueue).toHaveBeenCalledExactlyOnceWith(
        "Queue is full, try again in a minute",
        { variant: "warning" },
      );
    });

    it("gives the reason of the first skip when nothing was queued", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 0,
        skipped: [{ id: "a", reason: "not unresolved" }],
      });
      const { enqueue, result } = setup();

      await act(async () => {
        await result.current.analyse(["a"]);
      });

      expect(enqueue).toHaveBeenCalledExactlyOnceWith(
        "Not analysed: not unresolved",
        { variant: "warning" },
      );
    });
  });

  describe("optimistic pending state", () => {
    const withRuns = (...runs: TestRun[]) => {
      const hook = renderHookWithProviders(() => ({
        ...useAnalyseNoise(vi.fn()),
        state: useTestRunState(),
        dispatch: useTestRunDispatch(),
      }));
      act(() => {
        updateTestRun(hook.result.current.dispatch, runs);
      });
      return hook;
    };
    const analysisOf = (
      hook: ReturnType<typeof withRuns>,
      id: string,
    ): TestRun["noiseAnalysis"] =>
      hook.result.current.state.testRuns.find((item) => item.id === id)
        ?.noiseAnalysis;

    it("marks every queued run as pending at once", async () => {
      const hook = withRuns(unresolved("a"), unresolved("b"), unresolved("c"));
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 3,
        skipped: [],
      });

      await act(async () => {
        await hook.result.current.analyse(["a", "b", "c"]);
      });

      for (const id of ["a", "b", "c"]) {
        expect(isNoisePending(analysisOf(hook, id))).toBe(true);
      }
    });

    it("leaves skipped runs and runs outside the request as they were", async () => {
      const hook = withRuns(
        unresolved("a"),
        { ...unresolved("b"), noiseAnalysis: NOISE_ANALYSIS_NOISE },
        unresolved("c"),
      );
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 1,
        skipped: [{ id: "b", reason: "analysis off" }],
      });

      await act(async () => {
        await hook.result.current.analyse(["a", "b"]);
      });

      expect(isNoisePending(analysisOf(hook, "a"))).toBe(true);
      expect(analysisOf(hook, "b")).toEqual(NOISE_ANALYSIS_NOISE);
      expect(analysisOf(hook, "c")).toBeUndefined();
    });

    it("keeps a socket result that lands before the answer", async () => {
      const hook = withRuns(unresolved("a"), unresolved("b"));
      vi.spyOn(testRunService, "analyseNoise").mockImplementation(() => {
        act(() => {
          updateTestRun(hook.result.current.dispatch, [
            {
              ...unresolved("a"),
              status: TestStatus.approved,
              noiseAnalysis: NOISE_ANALYSIS_NOISE,
            },
          ]);
        });
        return Promise.resolve({ queued: 2, skipped: [] });
      });

      await act(async () => {
        await hook.result.current.analyse(["a", "b"]);
      });

      expect(analysisOf(hook, "a")).toEqual(NOISE_ANALYSIS_NOISE);
      expect(
        hook.result.current.state.testRuns.find((item) => item.id === "a")
          ?.status,
      ).toBe(TestStatus.approved);
      expect(isNoisePending(analysisOf(hook, "b"))).toBe(true);
    });

    it("changes nothing when the request fails", async () => {
      const hook = withRuns(unresolved("a"));
      vi.spyOn(testRunService, "analyseNoise").mockRejectedValue("No access");

      await act(async () => {
        await hook.result.current.analyse(["a"]);
      });

      expect(analysisOf(hook, "a")).toBeUndefined();
    });

    it("shows the pending state on the open run too", async () => {
      const hook = withRuns(unresolved("a"));
      act(() => {
        hook.result.current.dispatch({
          type: "select",
          payload: unresolved("a"),
        });
      });
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 1,
        skipped: [],
      });

      await act(async () => {
        await hook.result.current.analyse(["a"]);
      });

      expect(
        isNoisePending(
          hook.result.current.state.selectedTestRun?.noiseAnalysis,
        ),
      ).toBe(true);
    });

    it("lets a socket result replace the pending state", async () => {
      const hook = withRuns(unresolved("a"));
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 1,
        skipped: [],
      });
      await act(async () => {
        await hook.result.current.analyse(["a"]);
      });

      act(() => {
        updateTestRun(hook.result.current.dispatch, [
          { ...unresolved("a"), noiseAnalysis: NOISE_ANALYSIS_NOISE },
        ]);
      });

      expect(analysisOf(hook, "a")).toEqual(NOISE_ANALYSIS_NOISE);
    });

    it("is requesting only while the request is in flight", async () => {
      const hook = withRuns(unresolved("a"));
      let finish: (value: { queued: number; skipped: [] }) => void = () => {};
      vi.spyOn(testRunService, "analyseNoise").mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = hook.result.current.analyse(["a"]);
      });
      expect(hook.result.current.requesting).toBe(true);

      await act(async () => {
        finish({ queued: 1, skipped: [] });
        await pending;
      });
      expect(hook.result.current.requesting).toBe(false);
    });
  });
});
