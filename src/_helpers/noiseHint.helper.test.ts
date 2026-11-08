import { run } from "./testRun.fixture";
import {
  isNoiseAnalysed,
  isNoisePending,
  isNoiseResult,
  noiseAnalysisAvailable,
  noiseScoreOf,
  parseNoiseAnalysisConfig,
} from "./noiseHint.helper";
import { noiseHintOf } from "./noiseHint.helper";
import { ImageComparison } from "../types/imageComparison";
import { DEFAULT_NOISE_ANALYSIS_CONFIG } from "../constants";
import { TestStatus } from "../types/testStatus";
import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
} from "../_test/test.data.helper";
import type { NoiseAnalysisDto } from "../types/noiseAnalysis";

const unresolved = (noiseAnalysis: unknown) =>
  run({
    status: TestStatus.unresolved,
    noiseAnalysis: noiseAnalysis as NoiseAnalysisDto,
  });

describe("isNoiseResult", () => {
  it.each([
    ["a result", NOISE_ANALYSIS_NOISE, true],
    ["a foreign version", { ...NOISE_ANALYSIS_NOISE, version: 2 }, false],
    ["a pending marker", NOISE_ANALYSIS_PENDING, false],
    ["nothing", null, false],
    ["undefined", undefined, false],
  ])("is %s -> %s", (_, analysis, expected) => {
    expect(isNoiseResult(analysis)).toBe(expected);
  });
});

describe("isNoisePending", () => {
  it("recognises only the pending marker", () => {
    expect(isNoisePending(NOISE_ANALYSIS_PENDING)).toBe(true);
    expect(isNoisePending(NOISE_ANALYSIS_NOISE)).toBe(false);
    expect(isNoisePending(null)).toBe(false);
  });
});

describe("isNoiseAnalysed", () => {
  it.each([
    [NOISE_ANALYSIS_NOISE, true],
    [NOISE_ANALYSIS_CHANGE, true],
    [{ ...NOISE_ANALYSIS_NOISE, verdict: "unknown" }, true],
    [NOISE_ANALYSIS_PENDING, false],
    [{ ...NOISE_ANALYSIS_NOISE, version: 2 }, false],
    [{ ...NOISE_ANALYSIS_NOISE, verdict: "other" }, false],
    [null, false],
  ])("is decided for an unresolved run with %j", (analysis, expected) => {
    expect(isNoiseAnalysed(unresolved(analysis))).toBe(expected);
  });

  it("is false for a run that is not unresolved", () => {
    expect(
      isNoiseAnalysed(
        run({
          status: TestStatus.approved,
          noiseAnalysis: NOISE_ANALYSIS_NOISE,
        }),
      ),
    ).toBe(false);
  });
});

describe("noiseHintOf", () => {
  it.each([
    [NOISE_ANALYSIS_NOISE, "noise"],
    [NOISE_ANALYSIS_CHANGE, "change"],
    [NOISE_ANALYSIS_PENDING, "pending"],
  ])("classifies an unresolved run with %j as %s", (analysis, hint) => {
    expect(noiseHintOf(unresolved(analysis))).toBe(hint);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    [
      "an unknown verdict",
      { ...NOISE_ANALYSIS_NOISE, verdict: "unknown", reason: "no diff" },
    ],
    ["a foreign version", { ...NOISE_ANALYSIS_NOISE, version: 2 }],
    [
      "a verdict it does not know",
      { ...NOISE_ANALYSIS_NOISE, verdict: "maybe" },
    ],
    ["a pending flag that is not true", { pending: false, requestedAt: "x" }],
  ])("gives no hint for %s", (_, analysis) => {
    expect(noiseHintOf(unresolved(analysis))).toBeNull();
  });

  it.each([TestStatus.approved, TestStatus.autoApproved, TestStatus.failed])(
    "gives no hint to a %s run with a result",
    (status) => {
      expect(
        noiseHintOf(run({ status, noiseAnalysis: NOISE_ANALYSIS_NOISE })),
      ).toBeNull();
    },
  );
});

describe("noiseScoreOf", () => {
  it("gives the score of a result", () => {
    expect(noiseScoreOf(unresolved(NOISE_ANALYSIS_CHANGE))).toBeCloseTo(0.77);
  });

  it.each([
    ["a pending run", NOISE_ANALYSIS_PENDING],
    ["no result", null],
    ["an unknown verdict", { ...NOISE_ANALYSIS_NOISE, verdict: "unknown" }],
    ["a result without a score", { ...NOISE_ANALYSIS_NOISE, score: null }],
  ])("gives nothing for %s", (_, analysis) => {
    expect(noiseScoreOf(unresolved(analysis))).toBeNull();
  });
});

describe("parseNoiseAnalysisConfig", () => {
  it("fills what the saved config lacks from the defaults", () => {
    expect(parseNoiseAnalysisConfig('{"blur":{"enabled":false}}')).toEqual({
      blur: { ...DEFAULT_NOISE_ANALYSIS_CONFIG.blur, enabled: false },
      dinov2: DEFAULT_NOISE_ANALYSIS_CONFIG.dinov2,
    });
  });

  it.each([undefined, "", "not json", "null"])(
    "falls back to the defaults for %j",
    (json) => {
      expect(parseNoiseAnalysisConfig(json)).toEqual(
        DEFAULT_NOISE_ANALYSIS_CONFIG,
      );
    },
  );
});

describe("parseNoiseAnalysisConfig switches", () => {
  it("reads a config without enabled as off", () => {
    const config = parseNoiseAnalysisConfig("{}");
    expect(config.blur.enabled).toBe(false);
    expect(config.dinov2.enabled).toBe(false);
  });

  it("keeps a stored enabled: true on", () => {
    const config = parseNoiseAnalysisConfig(
      '{"blur":{"enabled":true},"dinov2":{"enabled":true}}',
    );
    expect(config.blur.enabled).toBe(true);
    expect(config.dinov2.enabled).toBe(true);
  });
});

describe("noiseAnalysisAvailable", () => {
  const project = (
    imageComparison: ImageComparison,
    noiseAnalysisConfig: string,
  ) => ({ imageComparison, noiseAnalysisConfig });

  it("is on for a pixel comparator with the blur stage enabled", () => {
    expect(
      noiseAnalysisAvailable(
        project(ImageComparison.pixelmatch, '{"blur":{"enabled":true}}'),
      ),
    ).toBe(true);
  });

  it("is off for a project saved before the config existed", () => {
    expect(noiseAnalysisAvailable(project(ImageComparison.odiff, ""))).toBe(
      false,
    );
  });

  it("is off when the blur stage is disabled, whatever dinov2 says", () => {
    expect(
      noiseAnalysisAvailable(
        project(
          ImageComparison.pixelmatch,
          '{"blur":{"enabled":false},"dinov2":{"enabled":true}}',
        ),
      ),
    ).toBe(false);
  });

  it("is off for the VLM comparator", () => {
    expect(
      noiseAnalysisAvailable(
        project(ImageComparison.vlm, '{"blur":{"enabled":true}}'),
      ),
    ).toBe(false);
  });

  it("is off with no project", () => {
    expect(noiseAnalysisAvailable(undefined)).toBe(false);
  });
});
