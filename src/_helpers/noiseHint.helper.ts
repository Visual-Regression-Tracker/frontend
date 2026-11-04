import type { Project, TestRun } from "../types";
import { DEFAULT_NOISE_ANALYSIS_CONFIG } from "../constants";
import { ImageComparison } from "../types/imageComparison";
import type { NoiseAnalysisConfig } from "../types/noiseAnalysis";
import { TestStatus } from "../types/testStatus";

export type NoiseHint = "noise" | "change" | "pending";

export const NOISE_HINT_FILTERS = [
  "Likely noise",
  "Likely change",
  "Not analysed",
] as const;

export type NoiseHintFilter = (typeof NOISE_HINT_FILTERS)[number];

const NOISE_ANALYSIS_VERSION = 1;

const NOISE_VERDICTS = ["noise", "change", "unknown"];

export function isNoiseAnalysed(
  run: Pick<TestRun, "status" | "noiseAnalysis">,
): boolean {
  const analysis = run.noiseAnalysis;
  return (
    run.status === TestStatus.unresolved &&
    !!analysis &&
    !("pending" in analysis) &&
    analysis.version === NOISE_ANALYSIS_VERSION &&
    NOISE_VERDICTS.includes(analysis.verdict)
  );
}

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

export function noiseScoreOf(
  run: Pick<TestRun, "status" | "noiseAnalysis">,
): number | null {
  const analysis = run.noiseAnalysis;
  if (noiseHintOf(run) === null || !analysis || !("score" in analysis)) {
    return null;
  }
  return typeof analysis.score === "number" ? analysis.score : null;
}

export function parseNoiseAnalysisConfig(
  json: string | undefined,
): NoiseAnalysisConfig {
  let saved: Partial<Record<keyof NoiseAnalysisConfig, object>> = {};
  try {
    saved = (JSON.parse(json || "{}") as typeof saved | null) ?? {};
  } catch {
    saved = {};
  }
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
