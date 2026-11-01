export type ImageComparisonConfig =
  PixelmatchConfig | LooksSameConfig | OdiffConfig | VlmConfig;

export enum ImageComparison {
  pixelmatch = "pixelmatch",
  lookSame = "lookSame",
  odiff = "odiff",
  vlm = "vlm",
}

/** Rendering-noise filter keys; the backend strips them before the library sees its options. */
export interface BlurAmplitudeConfig {
  blurAmplitudeFilter?: boolean;
  // 0-128; absent means the backend default
  blurAmplitudeThreshold?: number | null;
  // a second look by the DINOv2 service before the filter passes a run
  dinov2Check?: boolean;
  // (0, 2]; absent means the backend default
  dinov2Threshold?: number | null;
}

export interface PixelmatchConfig extends BlurAmplitudeConfig {
  allowDiffDimensions?: boolean;
  ignoreAntialiasing: boolean;
  threshold: number;
}

export interface LooksSameConfig extends BlurAmplitudeConfig {
  strict?: boolean;
  /** ΔE value treated as error in non-strict mode. */
  tolerance?: number;
  antialiasingTolerance?: number;
  ignoreAntialiasing?: boolean;
  ignoreCaret?: boolean;
  allowDiffDimensions?: boolean;
}

export interface OdiffConfig extends BlurAmplitudeConfig {
  outputDiffMask: boolean;
  failOnLayoutDiff: boolean;
  /** Color difference threshold, 0 to 1; lower is more precise. */
  threshold: number;
  antialiasing: boolean;
}

interface BaseVlmConfig extends BlurAmplitudeConfig {
  prompt: string;

  /** Response randomness, 0.0-1.0; lower is more consistent. @default 0.1 */
  temperature: number;

  /** Read the thinking field, which some models answer in. @default false */
  useThinking?: boolean;
}

export interface OllamaVlmConfig extends BaseVlmConfig {
  provider?: "ollama";

  /** Ollama vision model, e.g. "gemma3:12b". @default "gemma3:12b" */
  model: string;
}

export interface GeminiVlmConfig extends BaseVlmConfig {
  provider: "gemini";

  model: string;

  /** Google Gemini API key, required; stored per project. */
  apiKey: string;
}

export type VlmConfig = OllamaVlmConfig | GeminiVlmConfig;
