export enum ImageComparison {
  pixelmatch = "pixelmatch",
  lookSame = "lookSame",
  odiff = "odiff",
}

export interface PixelmatchConfig {
  allowDiffDimensions?: boolean;
  ignoreAntialiasing: boolean;
  threshold: number;
}
