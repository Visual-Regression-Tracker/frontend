import { ProjectDto } from "../types";
import { ImageComparison } from "../types/imageComparison";

export const PIXELMATCH_DEFAULT_CONFIG =
  '{"threshold":0.1,"ignoreAntialiasing":true,"allowDiffDimensions":false}';
export const LOOKSSAME_DEFAULT_CONFIG =
  '{"strict":false,"tolerance":2.3,"ignoreAntialiasing":true,"antialiasingTolerance":0,"ignoreCaret":true,"allowDiffDimensions":false}';
export const ODIFF_DEFAULT_CONFIG =
  '{"threshold":0,"antialiasing":true,"failOnLayoutDiff":true,"outputDiffMask":true}';
export const VLM_DEFAULT_CONFIG = JSON.stringify({
  model: "",
  prompt: `You are provided with three images:
1. First image: baseline screenshot
2. Second image: new version screenshot
3. Diff image

Spot any difference in text, color, shape and position of elements - treat as different even slight change.
Ignore minor rendering artifacts that are imperceptible to users like antialiasing.
Describe the difference in about 100 words.`,
  temperature: 0.1,
  useThinking: false,
});

export const DEFAULT_PROJECT_EDIT_STATE: ProjectDto = {
  id: "",
  name: "",
  mainBranchName: "",
  autoApproveFeature: true,
  imageComparison: ImageComparison.pixelmatch,
  imageComparisonConfig: PIXELMATCH_DEFAULT_CONFIG,
  maxBuildAllowed: 100,
  maxBranchLifetime: 30,
};
