import { ProjectDto } from "../types";
import { ImageComparison } from "../types/imageComparison";

export const PIXELMATCH_DEFAULT_CONFIG =
  '{"threshold":0.1,"ignoreAntialiasing":true,"allowDiffDimensions":false}';
export const LOOKSSAME_DEFAULT_CONFIG =
  '{"strict":false,"tolerance":2.3,"ignoreAntialiasing":true,"antialiasingTolerance":0,"ignoreCaret":true,"allowDiffDimensions":false}';

export const DEFAULT_PROJECT_EDIT_STATE: ProjectDto = {
  id: "",
  name: "",
  mainBranchName: "",
  autoApproveFeature: true,
  imageComparison: ImageComparison.pixelmatch,
  imageComparisonConfig: PIXELMATCH_DEFAULT_CONFIG,
};
