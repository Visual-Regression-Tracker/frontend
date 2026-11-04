import type { NoiseAnalysis, NoiseAnalysisDto, NoiseRegion } from "../types";
import { isNoiseResult, type NoiseAnalysisValue } from "./noiseHint.helper";

export type HintStage = "blur" | "dinov2";

const stageHasVerdict = (stage: object | undefined): boolean =>
  !!stage && "verdict" in stage;

export function hasRegions(
  analysis: NoiseAnalysisDto | NoiseAnalysis,
): analysis is NoiseAnalysis {
  return [analysis.blur, analysis.dinov2].every(
    (stage) => !stageHasVerdict(stage) || (stage && "regions" in stage),
  );
}

export function regionsOf(
  analysis: NoiseAnalysisValue,
  stage: HintStage,
): NoiseRegion[] {
  if (!isNoiseResult(analysis) || !hasRegions(analysis)) {
    return [];
  }
  const result = analysis[stage];
  return result && "regions" in result ? result.regions : [];
}
