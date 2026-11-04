import { act } from "@testing-library/react";
import { renderHookWithProviders } from "../_test/render";
import { run } from "../_helpers/testRun.fixture";
import { testRunService } from "../services";
import {
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
} from "../_test/test.data.helper";
import { type TestRun, TestStatus } from "../types";
import { updateTestRun, useTestRunDispatch } from "./testRun.context";
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  describe("requesting", () => {
    const withRuns = (...runs: TestRun[]) => {
      const hook = setup();
      act(() => {
        updateTestRun(hook.result.current.dispatch, runs);
      });
      return hook;
    };
    const show = (
      dispatch: ReturnType<typeof useTestRunDispatch>,
      id: string,
      noiseAnalysis: TestRun["noiseAnalysis"],
    ) => {
      act(() => {
        updateTestRun(dispatch, [{ ...unresolved(id), noiseAnalysis }]);
      });
    };

    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 2,
        skipped: [],
      });
    });

    it("stays on after the answer until every queued run shows as pending", async () => {
      const { result } = withRuns(unresolved("a"), unresolved("b"));

      await act(async () => {
        await result.current.analyse(["a", "b"]);
      });
      expect(result.current.requesting).toBe(true);

      show(result.current.dispatch, "a", NOISE_ANALYSIS_PENDING);
      expect(result.current.requesting).toBe(true);

      show(result.current.dispatch, "b", NOISE_ANALYSIS_PENDING);
      expect(result.current.requesting).toBe(false);

      show(result.current.dispatch, "a", null);
      expect(result.current.requesting).toBe(false);
    });

    it("is off at once when the pending event came before the answer", async () => {
      const { result } = withRuns(unresolved("a"), unresolved("b"));
      vi.spyOn(testRunService, "analyseNoise").mockImplementation(() => {
        show(result.current.dispatch, "a", NOISE_ANALYSIS_PENDING);
        show(result.current.dispatch, "b", NOISE_ANALYSIS_PENDING);
        return Promise.resolve({ queued: 2, skipped: [] });
      });

      await act(async () => {
        await result.current.analyse(["a", "b"]);
      });

      expect(result.current.requesting).toBe(false);
    });

    it("stops when a re-analysed run gets a new result", async () => {
      const { result } = withRuns({
        ...unresolved("a"),
        noiseAnalysis: NOISE_ANALYSIS_NOISE,
      });
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 1,
        skipped: [],
      });

      await act(async () => {
        await result.current.analyse(["a"]);
      });
      expect(result.current.requesting).toBe(true);

      show(result.current.dispatch, "a", {
        ...NOISE_ANALYSIS_NOISE,
        computedAt: "2026-11-04T11:00:00Z",
      });
      expect(result.current.requesting).toBe(false);
    });

    it("stops when the pending marker is cleared", async () => {
      const { result } = withRuns({
        ...unresolved("a"),
        noiseAnalysis: NOISE_ANALYSIS_PENDING,
      });
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 1,
        skipped: [],
      });

      await act(async () => {
        await result.current.analyse(["a"]);
      });
      expect(result.current.requesting).toBe(true);

      show(result.current.dispatch, "a", null);
      expect(result.current.requesting).toBe(false);
    });

    it("keeps waiting when the run is replaced by a copy with the same analysis", async () => {
      const { result } = withRuns({
        ...unresolved("a"),
        noiseAnalysis: NOISE_ANALYSIS_NOISE,
      });
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 1,
        skipped: [],
      });

      await act(async () => {
        await result.current.analyse(["a"]);
      });
      show(result.current.dispatch, "a", { ...NOISE_ANALYSIS_NOISE });

      expect(result.current.requesting).toBe(true);

      show(result.current.dispatch, "a", NOISE_ANALYSIS_PENDING);
      expect(result.current.requesting).toBe(false);
    });

    it("keeps waiting when the run is opened and its copy carries the same result", async () => {
      const analysed = {
        ...unresolved("a"),
        noiseAnalysis: NOISE_ANALYSIS_NOISE,
      };
      const { result } = withRuns(analysed);
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 1,
        skipped: [],
      });

      await act(async () => {
        await result.current.analyse(["a"]);
      });
      act(() => {
        result.current.dispatch({
          type: "select",
          payload: { ...analysed, noiseAnalysis: { ...NOISE_ANALYSIS_NOISE } },
        });
      });

      expect(result.current.requesting).toBe(true);
    });

    it("is off at once when the awaited runs are no longer in the list", async () => {
      const { result } = withRuns(unresolved("a"), unresolved("b"));

      await act(async () => {
        await result.current.analyse(["a", "b"]);
      });
      expect(result.current.requesting).toBe(true);

      act(() => {
        result.current.dispatch({ type: "get", payload: [unresolved("c")] });
      });

      expect(result.current.requesting).toBe(false);
    });

    it("gives up waiting for the pending event after three seconds", async () => {
      const { result } = withRuns(unresolved("a"), unresolved("b"));

      await act(async () => {
        await result.current.analyse(["a", "b"]);
      });
      expect(result.current.requesting).toBe(true);

      act(() => {
        vi.advanceTimersByTime(2900);
      });
      expect(result.current.requesting).toBe(true);

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current.requesting).toBe(false);
    });

    it("is off again at once when nothing was queued", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 0,
        skipped: [{ id: "a", reason: "not unresolved" }],
      });
      const { result } = withRuns(unresolved("a"));

      await act(async () => {
        await result.current.analyse(["a"]);
      });

      expect(result.current.requesting).toBe(false);
    });
  });
});
