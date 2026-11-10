export type NoiseVerdict = "noise" | "change" | "unknown";

export type NoiseHint = "noise" | "change" | "pending";

type NoiseUnknownReason = "sizes differ" | "no diff" | "image too large";

export interface NoiseAnalysisConfig {
  blur: { enabled: boolean };
  dinov2: { enabled: boolean };
}

export interface NoiseAnalysisDto {
  version: number;
  verdict: NoiseVerdict;
  score: number;
  reason: NoiseUnknownReason | null;
  computedAt: string;
}

export interface NoiseAnalysisPending {
  pending: true;
  requestedAt: string;
}

export interface NoiseAnalysisSkip {
  id: string;
  reason: "not unresolved" | "analysis off" | "queue full";
}

export interface NoiseAnalysisQueued {
  queued: number;
  skipped: NoiseAnalysisSkip[];
}
