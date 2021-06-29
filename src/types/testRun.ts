import { TestStatus } from "./testStatus";

export interface TestRun {
  id: string;
  buildId: string;
  imageName: string;
  diffName: string;
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
}
