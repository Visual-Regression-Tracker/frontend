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
  ignoreAreas: string;
}
