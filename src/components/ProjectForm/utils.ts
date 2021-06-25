import {
  LOOKSSAME_DEFAULT_CONFIG,
  PIXELMATCH_DEFAULT_CONFIG,
} from "../../constants";
import {
  ImageComparison,
  LooksSameConfig,
  PixelmatchConfig,
} from "../../types/imageComparison";

export const parseImageComparisonConfig = <
  T extends PixelmatchConfig | LooksSameConfig
>(
  config: string
): T => JSON.parse(config);

export const modifyConfigProp = <T extends PixelmatchConfig | LooksSameConfig>(
  config: string,
  name: keyof T,
  value: T[typeof name]
): string => {
  const parsed: T = JSON.parse(config);

  return JSON.stringify({
    ...parsed,
    [name]: value,
  });
};

export const getDefaultConfig = (imageComparison: ImageComparison): string => {
  switch (imageComparison) {
    case ImageComparison.pixelmatch:
      return PIXELMATCH_DEFAULT_CONFIG;
    case ImageComparison.lookSame:
      return LOOKSSAME_DEFAULT_CONFIG;
    default:
      return PIXELMATCH_DEFAULT_CONFIG;
  }
};
