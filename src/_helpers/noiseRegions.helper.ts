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

export function changedPatches(analysis: NoiseAnalysisValue): NoiseRegion[] {
  if (!isNoiseResult(analysis)) {
    return [];
  }
  const threshold = analysis.config.dinov2.distanceThreshold;
  return regionsOf(analysis, "dinov2").filter(
    ({ weight }) => weight > threshold,
  );
}

export type NoiselessCaveat =
  { kind: "dinov2 disagrees"; patches: number } | { kind: "no dinov2" } | null;

export function noiselessCaveat(analysis: NoiseAnalysisValue): NoiselessCaveat {
  if (!isNoiseResult(analysis)) {
    return { kind: "no dinov2" };
  }
  const { blur, dinov2 } = analysis;
  if (dinov2 && "verdict" in dinov2) {
    return blur?.verdict === "noise" && dinov2.verdict === "change"
      ? { kind: "dinov2 disagrees", patches: dinov2.signals.patches }
      : null;
  }
  if (
    dinov2 &&
    "skipped" in dinov2 &&
    dinov2.skipped === "blur sees a change"
  ) {
    return null;
  }
  return { kind: "no dinov2" };
}
