import type { TestRun } from "../types";
import { TestStatus } from "../types/testStatus";

export type NoiseHint = "noise" | "change" | "pending";

const NOISE_ANALYSIS_VERSION = 1;

export function noiseHintOf(
  run: Pick<TestRun, "status" | "noiseAnalysis">,
): NoiseHint | null {
  const analysis = run.noiseAnalysis;
  if (run.status !== TestStatus.unresolved || !analysis) {
    return null;
  }
  if ("pending" in analysis) {
    return analysis.pending === true ? "pending" : null;
  }
  if (analysis.version !== NOISE_ANALYSIS_VERSION) {
    return null;
  }
  return analysis.verdict === "noise" || analysis.verdict === "change"
    ? analysis.verdict
    : null;
}
