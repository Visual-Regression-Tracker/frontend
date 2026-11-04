import type {
  NoiseAnalysis,
  NoiseAnalysisDto,
  NoiseAnalysisPending,
  NoiseVerdict,
  Project,
  TestRun,
} from "../types";
import { DEFAULT_NOISE_ANALYSIS_CONFIG } from "../constants";
import { ImageComparison } from "../types/imageComparison";
import type { NoiseAnalysisConfig, NoiseHint } from "../types/noiseAnalysis";
import { TestStatus } from "../types/testStatus";
import { parseJson } from "./parseJson";

export const NOISE_HINT_FILTERS = [
  "Likely noise",
  "Likely change",
  "Not analysed",
] as const;

export type NoiseHintFilter = (typeof NOISE_HINT_FILTERS)[number];

export type NoiseAnalysisValue = TestRun["noiseAnalysis"] | NoiseAnalysis;

const NOISE_ANALYSIS_VERSION = 1;

const NOISE_VERDICTS: readonly NoiseVerdict[] = ["noise", "change", "unknown"];

export function isNoiseResult(
  analysis: NoiseAnalysisValue,
): analysis is NoiseAnalysisDto | NoiseAnalysis {
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

export function isNoiseAnalysed(run: DecidedRun): boolean {
  return (
    run.status === TestStatus.unresolved && isNoiseResult(run.noiseAnalysis)
  );
}

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

export function noiseScoreOf(run: DecidedRun): number | null {
  const analysis = run.noiseAnalysis;
  if (noiseHintOf(run) === null || !analysis || !("score" in analysis)) {
    return null;
  }
  return typeof analysis.score === "number" ? analysis.score : null;
}

export function parseNoiseAnalysisConfig(
  json: string | undefined,
): NoiseAnalysisConfig {
  const saved =
    parseJson<Partial<Record<keyof NoiseAnalysisConfig, object>> | null>(
      json || "{}",
      {},
    ) ?? {};
  return {
    ...saved,
    blur: { ...DEFAULT_NOISE_ANALYSIS_CONFIG.blur, ...saved.blur },
    dinov2: { ...DEFAULT_NOISE_ANALYSIS_CONFIG.dinov2, ...saved.dinov2 },
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
