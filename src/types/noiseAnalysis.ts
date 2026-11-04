export type NoiseVerdict = "noise" | "change" | "unknown";

export type NoiseUnknownReason = "sizes differ" | "no diff" | "image too large";

export interface NoiseAnalysisConfig {
  blur: {
    enabled: boolean;
    amplitudeThreshold: number;
    solidShareMax: number;
  };
  dinov2: {
    enabled: boolean;
    distanceThreshold: number;
  };
}

export interface NoiseRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  weight: number;
}

export interface NoiseBlurResult {
  verdict: NoiseVerdict;
  score: number;
  signals: { amplitude: number; solidShare: number; density: number };
}

export interface NoiseDinov2Result {
  verdict: NoiseVerdict;
  score: number;
  signals: { distance: number; patches: number };
}

export type NoiseDinov2Skipped = { skipped: "blur sees a change" | "off" };

export type NoiseDinov2Error = { error: "dinov2 unavailable" };

export interface NoiseAnalysisDto {
  version: number;
  verdict: NoiseVerdict;
  score: number;
  reason: NoiseUnknownReason | null;
  config: {
    blur: Omit<NoiseAnalysisConfig["blur"], "enabled">;
    dinov2: Omit<NoiseAnalysisConfig["dinov2"], "enabled">;
  };
  blur?: NoiseBlurResult;
  dinov2?: NoiseDinov2Result | NoiseDinov2Skipped | NoiseDinov2Error;
  computedAt: string;
}

export interface NoiseAnalysis extends Omit<
  NoiseAnalysisDto,
  "blur" | "dinov2"
> {
  blur?: NoiseBlurResult & { regions: NoiseRegion[] };
  dinov2?:
    | (NoiseDinov2Result & { regions: NoiseRegion[] })
    | NoiseDinov2Skipped
    | NoiseDinov2Error;
}

export interface NoiseAnalysisPending {
  pending: true;
  requestedAt: string;
}

export interface NoiseSummary {
  unresolved: number;
  analysed: number;
  noiseLike: number;
  byEnvironment: {
    browser: string;
    os: string;
    device: string;
    unresolved: number;
    noiseLike: number;
  }[];
  projectTypical?: number;
}

export interface NoiseAnalysisSkip {
  id: string;
  reason: "not unresolved" | "analysis off" | "queue full";
}

export interface NoiseAnalysisQueued {
  queued: number;
  skipped: NoiseAnalysisSkip[];
}
