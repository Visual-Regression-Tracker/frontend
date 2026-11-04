import type {
  NoiseAnalysis,
  NoiseAnalysisDto,
  NoiseAnalysisPending,
  NoiseRegion,
  TestRun,
} from "../types";

export type HintStage = "blur" | "dinov2";

type Analysis = TestRun["noiseAnalysis"] | NoiseAnalysis;

export function isNoiseResult(
  analysis: Analysis,
): analysis is NoiseAnalysisDto | NoiseAnalysis {
  return !!analysis && !("pending" in analysis) && analysis.version === 1;
}

export function isNoisePending(
  analysis: Analysis,
): analysis is NoiseAnalysisPending {
  return !!analysis && "pending" in analysis && analysis.pending === true;
}

const stageHasVerdict = (stage: object | undefined): boolean =>
  !!stage && "verdict" in stage;

export function hasRegions(
  analysis: NoiseAnalysisDto | NoiseAnalysis,
): analysis is NoiseAnalysis {
  return [analysis.blur, analysis.dinov2].every(
    (stage) => !stageHasVerdict(stage) || (stage && "regions" in stage),
  );
}

export function regionsOf(analysis: Analysis, stage: HintStage): NoiseRegion[] {
  if (!isNoiseResult(analysis) || !hasRegions(analysis)) {
    return [];
  }
  const result = analysis[stage];
  return result && "regions" in result ? result.regions : [];
}
