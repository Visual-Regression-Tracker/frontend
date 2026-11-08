import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
} from "../_test/test.data.helper";
import { REGION, withRegions } from "../_test/noiseRegions";
import type { NoiseAnalysis } from "../types";
import {
  changedPatches,
  hasRegions,
  noiselessCaveat,
  regionsOf,
} from "./noiseRegions.helper";

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

describe("changedPatches", () => {
  const weighted = (weight: number) => ({ ...REGION, weight });

  it("keeps the DINOv2 patches above the distance threshold", () => {
    const analysis = withRegions(
      NOISE_ANALYSIS_CHANGE,
      [weighted(0.9)],
      [weighted(0.2), weighted(0.15), weighted(0.1)],
    );

    expect(changedPatches(analysis)).toEqual([weighted(0.2)]);
  });

  it("is empty without an analysis result", () => {
    expect(changedPatches(NOISE_ANALYSIS_PENDING)).toEqual([]);
    expect(changedPatches(null)).toEqual([]);
  });
});

describe("noiselessCaveat", () => {
  it("flags DINOv2 seeing a change the blur stage calls noise", () => {
    expect(noiselessCaveat(NOISE_ANALYSIS_CHANGE)).toEqual({
      kind: "dinov2 disagrees",
      patches: 8,
    });
  });

  it("has none when both stages agree", () => {
    expect(noiselessCaveat(NOISE_ANALYSIS_NOISE)).toBeNull();
  });

  it("has none when the blur stage already saw a change", () => {
    expect(
      noiselessCaveat({
        ...NOISE_ANALYSIS_NOISE,
        dinov2: { skipped: "blur sees a change" },
      }),
    ).toBeNull();
  });

  it.each([
    ["DINOv2 is off", { ...NOISE_ANALYSIS_NOISE, dinov2: { skipped: "off" } }],
    [
      "DINOv2 did not answer",
      { ...NOISE_ANALYSIS_NOISE, dinov2: { error: "dinov2 unavailable" } },
    ],
    ["the run was not analysed", null],
    ["the analysis is pending", NOISE_ANALYSIS_PENDING],
  ] as const)("warns about faint changes when %s", (_, analysis) => {
    expect(noiselessCaveat(analysis)).toEqual({ kind: "no dinov2" });
  });
});
