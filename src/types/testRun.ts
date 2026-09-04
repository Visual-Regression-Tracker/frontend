import { TestStatus } from "./testStatus";

export interface TestRun {
  id: string;
  buildId: string;
  imageName: string;
  diffName: string;
  // Small copies the API makes at ingest for the card grids to draw. Absent on
  // runs ingested before they existed, and on runs with no saved diff.
  imageThumbnailName?: string;
  diffThumbnailName?: string;
  diffPercent: number;
  diffTollerancePercent: number;
  status: TestStatus;
  testVariationId: string;
  name: string;
  baselineName: string;
  os: string;
  browser: string;
  viewport: string;
  device: string;
  customTags: string;
  ignoreAreas: string;
  tempIgnoreAreas: string;
  comment?: string;
  branchName: string;
  baselineBranchName: string;
  merge: boolean;
  vlmDescription?: string;
}
