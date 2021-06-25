import {
  LOOKSSAME_DEFAULT_CONFIG,
  ODIFF_DEFAULT_CONFIG,
  PIXELMATCH_DEFAULT_CONFIG,
} from "../../constants";
import { ImageComparison } from "../../types/imageComparison";

export const getDefaultConfig = (imageComparison: ImageComparison): string => {
  switch (imageComparison) {
    case ImageComparison.pixelmatch:
      return PIXELMATCH_DEFAULT_CONFIG;
    case ImageComparison.lookSame:
      return LOOKSSAME_DEFAULT_CONFIG;
    case ImageComparison.odiff:
      return ODIFF_DEFAULT_CONFIG;
    default:
      return PIXELMATCH_DEFAULT_CONFIG;
  }
};
