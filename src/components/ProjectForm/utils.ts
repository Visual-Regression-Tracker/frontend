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

/** The filter is no library's own option; swapped defaults must not switch it off. */
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
