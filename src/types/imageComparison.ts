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

export interface VlmConfig {
  model: string;
  prompt: string;
  temperature: number;
  useThinking?: boolean;
}
