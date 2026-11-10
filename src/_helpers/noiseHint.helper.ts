import type {
  NoiseAnalysisDto,
  NoiseAnalysisPending,
  NoiseVerdict,
  Project,
  TestRun,
} from "../types";
import { ImageComparison } from "../types/imageComparison";
import type { NoiseAnalysisConfig, NoiseHint } from "../types/noiseAnalysis";
import { TestStatus } from "../types/testStatus";
import { parseJson } from "./parseJson";

export type NoiseAnalysisValue = TestRun["noiseAnalysis"];

const NOISE_ANALYSIS_VERSION = 1;

const NOISE_VERDICTS: readonly NoiseVerdict[] = ["noise", "change", "unknown"];

export function isNoiseResult(
  analysis: NoiseAnalysisValue,
): analysis is NoiseAnalysisDto {
  return (
    !!analysis &&
    !("pending" in analysis) &&
    analysis.version === NOISE_ANALYSIS_VERSION &&
    NOISE_VERDICTS.includes(analysis.verdict)
  );
}

export function isNoisePending(
  analysis: NoiseAnalysisValue,
): analysis is NoiseAnalysisPending {
  return !!analysis && "pending" in analysis && analysis.pending === true;
}

type DecidedRun = Pick<TestRun, "status" | "noiseAnalysis">;

export function noiseHintOf(run: DecidedRun): NoiseHint | null {
  const analysis = run.noiseAnalysis;
  if (run.status !== TestStatus.unresolved) {
    return null;
  }
  if (isNoisePending(analysis)) {
    return "pending";
  }
  return isNoiseResult(analysis) &&
    (analysis.verdict === "noise" || analysis.verdict === "change")
    ? analysis.verdict
    : null;
}

export function parseNoiseAnalysisConfig(
  json: string | undefined,
): NoiseAnalysisConfig {
  const saved =
    parseJson<Partial<
      Record<keyof NoiseAnalysisConfig, { enabled?: unknown }>
    > | null>(json || "{}", {}) ?? {};
  return {
    blur: { enabled: saved.blur?.enabled === true },
    dinov2: { enabled: saved.dinov2?.enabled === true },
  };
}

export function noiseAnalysisAvailable(
  project: Pick<Project, "imageComparison" | "noiseAnalysisConfig"> | undefined,
): boolean {
  return (
    !!project &&
    project.imageComparison !== ImageComparison.vlm &&
    parseNoiseAnalysisConfig(project.noiseAnalysisConfig).blur.enabled
  );
}
