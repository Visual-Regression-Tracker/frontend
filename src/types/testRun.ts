import { TestStatus } from "./testStatus";

export interface TestRun {
  id: string;
  buildId: string;
  imageName: string;
  diffName: string | null;
  // Small copies made at ingest for the card grids; absent on older runs and runs with no saved diff.
  imageThumbnailName?: string | null;
  diffThumbnailName?: string | null;
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
