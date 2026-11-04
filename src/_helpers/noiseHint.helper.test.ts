import { run } from "./testRun.fixture";
import { noiseHintOf } from "./noiseHint.helper";
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
