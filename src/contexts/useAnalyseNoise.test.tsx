import { act } from "@testing-library/react";
import { renderHookWithProviders } from "../_test/render";
import { run } from "../_helpers/testRun.fixture";
import { testRunService } from "../services";
import { NOISE_ANALYSIS_PENDING } from "../_test/test.data.helper";
import { TestStatus } from "../types";
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
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 2,
        skipped: [],
      });
    });

    it("stays on after the answer until the queued runs show as pending", async () => {
      const { result } = setup();
      act(() => {
        updateTestRun(result.current.dispatch, [
          unresolved("a"),
          unresolved("b"),
        ]);
      });

      await act(async () => {
        await result.current.analyse(["a", "b"]);
      });
      expect(result.current.requesting).toBe(true);

      act(() => {
        updateTestRun(result.current.dispatch, [
          { ...unresolved("a"), noiseAnalysis: NOISE_ANALYSIS_PENDING },
        ]);
      });
      expect(result.current.requesting).toBe(true);

      act(() => {
        updateTestRun(result.current.dispatch, [
          { ...unresolved("b"), noiseAnalysis: NOISE_ANALYSIS_PENDING },
        ]);
      });
      expect(result.current.requesting).toBe(false);

      act(() => {
        updateTestRun(result.current.dispatch, [unresolved("a")]);
      });
      expect(result.current.requesting).toBe(false);
    });

    it("gives up waiting for the pending event after three seconds", async () => {
      const { result } = setup();

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
      const { result } = setup();

      await act(async () => {
        await result.current.analyse(["a"]);
      });

      expect(result.current.requesting).toBe(false);
    });
  });
});
