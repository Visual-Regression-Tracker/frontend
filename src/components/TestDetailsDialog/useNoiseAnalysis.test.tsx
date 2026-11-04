import { renderHook, waitFor } from "@testing-library/react";
import { run } from "../../_helpers/testRun.fixture";
import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
} from "../../_test/test.data.helper";
import { testRunService } from "../../services";
import { withRegions } from "../../_test/noiseRegions";
import type { TestRun } from "../../types";
import { useNoiseAnalysis } from "./useNoiseAnalysis";

const runWith = (noiseAnalysis: TestRun["noiseAnalysis"]) =>
  run({ id: "r1", noiseAnalysis });

const renderAnalysis = (initial: TestRun) =>
  renderHook(({ testRun }) => useNoiseAnalysis(testRun), {
    initialProps: { testRun: initial },
  });

describe("useNoiseAnalysis", () => {
  it("returns a result that already has regions without fetching", () => {
    const getDetails = vi.spyOn(testRunService, "getDetails");
    const full = withRegions(NOISE_ANALYSIS_CHANGE);

    const { result } = renderAnalysis(runWith(full));

    expect(result.current).toBe(full);
    expect(getDetails).not.toHaveBeenCalled();
  });

  it("fetches the run and returns its full result when the list copy has no regions", async () => {
    const full = withRegions(NOISE_ANALYSIS_CHANGE);
    const getDetails = vi
      .spyOn(testRunService, "getDetails")
      .mockResolvedValue(runWith(full));

    const { result } = renderAnalysis(runWith(NOISE_ANALYSIS_CHANGE));

    expect(result.current).toBe(NOISE_ANALYSIS_CHANGE);
    await waitFor(() => expect(result.current).toEqual(full));
    expect(getDetails).toHaveBeenCalledExactlyOnceWith("r1");
  });

  it.each([
    ["no analysis", null],
    ["a pending marker", NOISE_ANALYSIS_PENDING],
    ["a foreign version", { ...NOISE_ANALYSIS_NOISE, version: 2 }],
    [
      "a result without stages",
      {
        ...NOISE_ANALYSIS_NOISE,
        verdict: "unknown" as const,
        blur: undefined,
        dinov2: undefined,
      },
    ],
  ])("does not fetch for %s", (_, analysis) => {
    const getDetails = vi.spyOn(testRunService, "getDetails");

    const { result } = renderAnalysis(runWith(analysis));

    expect(result.current).toBe(analysis);
    expect(getDetails).not.toHaveBeenCalled();
  });

  it("fetches again when the result is renewed", async () => {
    const renewed = {
      ...NOISE_ANALYSIS_NOISE,
      computedAt: "2026-11-04T11:00:00Z",
    };
    const getDetails = vi
      .spyOn(testRunService, "getDetails")
      .mockResolvedValueOnce(runWith(withRegions(NOISE_ANALYSIS_NOISE)))
      .mockResolvedValueOnce(runWith(withRegions(renewed)));
    const { result, rerender } = renderAnalysis(runWith(NOISE_ANALYSIS_NOISE));
    await waitFor(() => expect(result.current).toHaveProperty("blur.regions"));

    rerender({ testRun: runWith(NOISE_ANALYSIS_PENDING) });
    rerender({ testRun: runWith(renewed) });

    expect(result.current).toBe(renewed);
    await waitFor(() => expect(result.current).toEqual(withRegions(renewed)));
    expect(getDetails).toHaveBeenCalledTimes(2);
  });

  it("ignores a fetched result older than the one the list holds", async () => {
    vi.spyOn(testRunService, "getDetails").mockResolvedValue(
      runWith(withRegions(NOISE_ANALYSIS_NOISE)),
    );
    const newer = {
      ...NOISE_ANALYSIS_NOISE,
      computedAt: "2026-11-04T11:00:00Z",
    };

    const { result } = renderAnalysis(runWith(newer));

    await waitFor(() => expect(testRunService.getDetails).toHaveBeenCalled());
    await Promise.resolve();
    expect(result.current).toBe(newer);
  });

  it("keeps the result without regions when the fetch fails", async () => {
    const getDetails = vi
      .spyOn(testRunService, "getDetails")
      .mockRejectedValue("Not found");

    const { result } = renderAnalysis(runWith(NOISE_ANALYSIS_NOISE));

    await waitFor(() => expect(getDetails).toHaveBeenCalled());
    expect(result.current).toBe(NOISE_ANALYSIS_NOISE);
  });

  it("does not show another run's regions", async () => {
    vi.spyOn(testRunService, "getDetails").mockResolvedValue(
      runWith(withRegions(NOISE_ANALYSIS_NOISE)),
    );
    const { result, rerender } = renderAnalysis(runWith(NOISE_ANALYSIS_NOISE));
    await waitFor(() => expect(result.current).toHaveProperty("blur.regions"));

    const other = run({ id: "r2", noiseAnalysis: NOISE_ANALYSIS_NOISE });
    rerender({ testRun: other });

    expect(result.current).toBe(NOISE_ANALYSIS_NOISE);
  });
});
