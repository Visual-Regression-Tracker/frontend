import { run } from "./testRun.fixture";
import {
  buildNoiseCaption,
  rendererChangeText,
  looksLikeRendererChange,
} from "./noiseSummary.helper";
import { TestStatus } from "../types/testStatus";
import type { NoiseSummary } from "../types/noiseAnalysis";
import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
  NOISE_SUMMARY,
} from "../_test/test.data.helper";

const group = (
  browser: string,
  unresolved: number,
  noiseLike: number,
  os = "Linux",
  device = "",
) => ({ browser, os, device, unresolved, noiseLike });

const summary = (overrides: Partial<NoiseSummary> = {}): NoiseSummary => ({
  unresolved: 10,
  analysed: 10,
  noiseLike: 8,
  byEnvironment: [group("chrome", 5, 4), group("firefox", 5, 4)],
  ...overrides,
});

describe("buildNoiseCaption", () => {
  const unresolved = (noiseAnalysis?: unknown) =>
    run({
      status: TestStatus.unresolved,
      noiseAnalysis: noiseAnalysis as never,
    });

  it("counts noise and analysed runs among the unresolved ones", () => {
    const runs = [
      unresolved(NOISE_ANALYSIS_NOISE),
      unresolved(NOISE_ANALYSIS_NOISE),
      unresolved(NOISE_ANALYSIS_CHANGE),
      unresolved(NOISE_ANALYSIS_PENDING),
      unresolved(),
      run({ status: TestStatus.approved, noiseAnalysis: NOISE_ANALYSIS_NOISE }),
    ];

    expect(buildNoiseCaption(runs)).toBe(
      "2 of 5 unresolved look like rendering noise · analysed 3 of 5",
    );
  });

  it("is null when nothing is unresolved", () => {
    expect(
      buildNoiseCaption([run({ status: TestStatus.approved })]),
    ).toBeNull();
    expect(buildNoiseCaption([])).toBeNull();
  });
});

describe("looksLikeRendererChange", () => {
  it("is false below 5 unresolved", () => {
    expect(
      looksLikeRendererChange(
        summary({ unresolved: 4, analysed: 4, noiseLike: 4 }),
      ),
    ).toBe(false);
  });

  it("is true with 4 noise of 5 and no project history", () => {
    expect(
      looksLikeRendererChange(
        summary({ unresolved: 5, analysed: 5, noiseLike: 4 }),
      ),
    ).toBe(true);
  });

  it("is false below 80 % without history", () => {
    expect(
      looksLikeRendererChange(
        summary({ unresolved: 10, analysed: 10, noiseLike: 7 }),
      ),
    ).toBe(false);
  });

  it("needs both twice the typical share and half of the runs with history", () => {
    expect(
      looksLikeRendererChange(
        summary({
          unresolved: 10,
          analysed: 10,
          noiseLike: 3,
          projectTypical: 0.1,
        }),
      ),
    ).toBe(false);
    expect(
      looksLikeRendererChange(
        summary({
          unresolved: 10,
          analysed: 10,
          noiseLike: 6,
          projectTypical: 0.1,
        }),
      ),
    ).toBe(true);
  });

  it("is false when the share is only 1.5 times the typical one", () => {
    expect(
      looksLikeRendererChange(
        summary({
          unresolved: 20,
          analysed: 20,
          noiseLike: 3,
          projectTypical: 0.1,
        }),
      ),
    ).toBe(false);
  });

  it("needs half of the runs to be noise even when typical is tiny", () => {
    expect(
      looksLikeRendererChange(
        summary({
          unresolved: 10,
          analysed: 10,
          noiseLike: 4,
          projectTypical: 0.01,
        }),
      ),
    ).toBe(false);
    expect(
      looksLikeRendererChange(
        summary({
          unresolved: 10,
          analysed: 10,
          noiseLike: 5,
          projectTypical: 0.01,
        }),
      ),
    ).toBe(true);
  });

  it("is false when not every unresolved run is analysed", () => {
    expect(
      looksLikeRendererChange(
        summary({ unresolved: 10, analysed: 9, noiseLike: 9 }),
      ),
    ).toBe(false);
  });

  it("holds for the shared fixture", () => {
    expect(looksLikeRendererChange(NOISE_SUMMARY)).toBe(true);
  });
});

describe("rendererChangeText", () => {
  const all = (overrides: Partial<NoiseSummary>) =>
    summary({ unresolved: 34, analysed: 34, noiseLike: 34, ...overrides });

  it("names the browser when all noise sits in one environment", () => {
    expect(
      rendererChangeText(
        all({
          byEnvironment: [group("chrome", 34, 34)],
          projectTypical: 0.1,
        }),
      ),
    ).toBe(
      "Chrome runs look like a renderer change: 34 of 34 diffs are rendering noise (usually 10 % in this project). Filter likely noise and review them in one pass",
    );
  });

  it("names the environment even when other groups have no noise", () => {
    expect(
      rendererChangeText(
        all({
          byEnvironment: [group("chrome", 30, 34), group("safari", 4, 0)],
        }),
      ),
    ).toMatch(/^Chrome runs look like/);
  });

  it("falls back to os, then device, when the browser is empty", () => {
    expect(
      rendererChangeText(
        all({ byEnvironment: [group("", 34, 34, "Linux", "")] }),
      ),
    ).toMatch(/^Linux runs/);
    expect(
      rendererChangeText(
        all({ byEnvironment: [group("", 34, 34, "", "iPhone")] }),
      ),
    ).toMatch(/^iPhone runs/);
  });

  it("speaks about the build when the noise is spread over environments", () => {
    expect(
      rendererChangeText(
        all({
          byEnvironment: [group("chrome", 17, 17), group("firefox", 17, 17)],
          projectTypical: 0.1,
        }),
      ),
    ).toBe(
      "This build looks like a renderer change: 34 of 34 diffs are rendering noise (usually 10 % in this project). Filter likely noise and review them in one pass",
    );
  });

  it("omits the usual share without project history", () => {
    expect(
      rendererChangeText(all({ byEnvironment: [group("chrome", 34, 34)] })),
    ).toBe(
      "Chrome runs look like a renderer change: 34 of 34 diffs are rendering noise. Filter likely noise and review them in one pass",
    );
  });

  it("rounds the usual share to an integer", () => {
    expect(
      rendererChangeText(
        all({
          byEnvironment: [group("chrome", 34, 34)],
          projectTypical: 0.126,
        }),
      ),
    ).toContain("(usually 13 % in this project)");
  });

  it("is null when the rule does not hold", () => {
    expect(
      rendererChangeText(summary({ unresolved: 4, analysed: 4 })),
    ).toBeNull();
  });
});
