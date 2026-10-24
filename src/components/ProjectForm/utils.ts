import {
  LOOKSSAME_DEFAULT_CONFIG,
  ODIFF_DEFAULT_CONFIG,
  PIXELMATCH_DEFAULT_CONFIG,
  VLM_DEFAULT_CONFIG,
} from "../../constants";
import {
  BlurAmplitudeConfig,
  ImageComparison,
} from "../../types/imageComparison";

export const getDefaultConfig = (imageComparison: ImageComparison): string => {
  switch (imageComparison) {
    case ImageComparison.pixelmatch:
      return PIXELMATCH_DEFAULT_CONFIG;
    case ImageComparison.lookSame:
      return LOOKSSAME_DEFAULT_CONFIG;
    case ImageComparison.odiff:
      return ODIFF_DEFAULT_CONFIG;
    case ImageComparison.vlm:
      return VLM_DEFAULT_CONFIG;
    default:
      return PIXELMATCH_DEFAULT_CONFIG;
  }
};

/**
 * Carries the rendering-noise filter's keys from one config into another. The
 * filter is not one of a library's own options, so swapping in a library's (or
 * a VLM provider's) defaults must not silently switch it off.
 */
export const withBlurAmplitudeOf = (
  config: string,
  previousConfig: string,
): string => {
  const {
    blurAmplitudeFilter,
    blurAmplitudeThreshold,
    dinov2Check,
    dinov2Threshold,
  }: BlurAmplitudeConfig = JSON.parse(previousConfig);
  return JSON.stringify({
    ...JSON.parse(config),
    blurAmplitudeFilter,
    blurAmplitudeThreshold,
    dinov2Check,
    dinov2Threshold,
  });
};
