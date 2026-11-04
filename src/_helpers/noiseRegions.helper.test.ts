import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
} from "../_test/test.data.helper";
import { REGION, withRegions } from "../_test/noiseRegions";
import type { NoiseAnalysis } from "../types";
import { hasRegions, regionsOf } from "./noiseRegions.helper";

const full = (): NoiseAnalysis =>
  withRegions(NOISE_ANALYSIS_CHANGE, [REGION], [REGION, REGION]);

describe("hasRegions", () => {
  it("is false for the Dto the list holds", () => {
    expect(hasRegions(NOISE_ANALYSIS_NOISE)).toBe(false);
  });

  it("is true for the full object", () => {
    expect(hasRegions(full())).toBe(true);
  });

  it("is true when the second stage was skipped or failed", () => {
    const { blur } = full();
    expect(
      hasRegions({ ...NOISE_ANALYSIS_NOISE, blur, dinov2: { skipped: "off" } }),
    ).toBe(true);
    expect(
      hasRegions({
        ...NOISE_ANALYSIS_NOISE,
        blur,
        dinov2: { error: "dinov2 unavailable" },
      }),
    ).toBe(true);
  });
});

describe("regionsOf", () => {
  it("returns the regions of the asked stage", () => {
    expect(regionsOf(full(), "blur")).toEqual([REGION]);
    expect(regionsOf(full(), "dinov2")).toEqual([REGION, REGION]);
  });

  it.each([
    ["a Dto", NOISE_ANALYSIS_NOISE],
    ["nothing", null],
    ["a pending marker", NOISE_ANALYSIS_PENDING],
    ["a skipped stage", { ...full(), dinov2: { skipped: "off" as const } }],
  ])("returns none for %s", (_, analysis) => {
    expect(regionsOf(analysis, "dinov2")).toEqual([]);
  });
});
