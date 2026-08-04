export type ImageComparisonConfig =
  | PixelmatchConfig
  | LooksSameConfig
  | OdiffConfig
  | VlmConfig;

export enum ImageComparison {
  pixelmatch = "pixelmatch",
  lookSame = "lookSame",
  odiff = "odiff",
  vlm = "vlm",
}

export interface PixelmatchConfig {
  allowDiffDimensions?: boolean;
  ignoreAntialiasing: boolean;
  threshold: number;
}

export interface LooksSameConfig {
  /**
   * strict comparsion
   */
  strict?: boolean;
  /**
   * ΔE value that will be treated as error in non-strict mode
   */
  tolerance?: number;
  /**
   * makes the search algorithm of the antialiasing less strict
   */
  antialiasingTolerance?: number;
  /**
   * Ability to ignore antialiasing
   */
  ignoreAntialiasing?: boolean;
  /**
   * Ability to ignore text caret
   */
  ignoreCaret?: boolean;
  allowDiffDimensions?: boolean;
}

export interface OdiffConfig {
  /** Output full diff image. */
  outputDiffMask: boolean;
  /** Do not compare images and produce output if images layout is different. */
  failOnLayoutDiff: boolean;
  /** Color difference threshold (from 0 to 1). Less more precise. */
  threshold: number;
  /** If this is true, antialiased pixels are not counted to the diff of an image */
  antialiasing: boolean;
}

/**
 * Base configuration shared by all VLM providers
 */
export interface BaseVlmConfig {
  /**
   * Custom prompt for image comparison.
   */
  prompt: string;

  /**
   * Temperature parameter controlling response randomness (0.0-1.0).
   * Lower values = more consistent results.
   * @default 0.1
   */
  temperature: number;

  /**
   * Whether to prefer thinking field over content field for response.
   * Some models return result in thinking field instead of response.
   * @default false
   */
  useThinking?: boolean;
}

/**
 * Configuration for Ollama provider
 */
export interface OllamaVlmConfig extends BaseVlmConfig {
  provider?: 'ollama';

  /**
   * Ollama vision model name.
   * Examples: "gemma3:12b", "llava:13b"
   * @default "gemma3:12b"
   */
  model: string;
}

/**
 * Configuration for Gemini provider
 */
export interface GeminiVlmConfig extends BaseVlmConfig {
  provider: 'gemini';

  /**
   * Gemini model name.
   * Examples: "gemini-1.5-pro", "gemini-1.5-flash"
   */
  model: string;

  /**
   * Google Gemini API key (required).
   * Stored in project settings for per-project configuration.
   */
  apiKey: string;
}

/**
 * Union type for all VLM provider configurations
 */
export type VlmConfig = OllamaVlmConfig | GeminiVlmConfig;
