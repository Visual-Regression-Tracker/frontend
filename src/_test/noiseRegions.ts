import type { NoiseAnalysis, NoiseAnalysisDto, NoiseRegion } from "../types";

export const REGION: NoiseRegion = {
  x: 1,
  y: 2,
  width: 3,
  height: 4,
  weight: 0.5,
};

export const withRegions = (
  analysis: NoiseAnalysisDto,
  blur: NoiseRegion[] = [REGION],
  dinov2: NoiseRegion[] = blur,
): NoiseAnalysis => ({
  ...analysis,
  blur: analysis.blur && { ...analysis.blur, regions: blur },
  dinov2:
    analysis.dinov2 && "verdict" in analysis.dinov2
      ? { ...analysis.dinov2, regions: dinov2 }
      : analysis.dinov2,
});
