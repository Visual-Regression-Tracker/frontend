import { TestStatus } from "./testStatus";
import { TestVariation } from "./testVariation";

export interface TestRun {
  id: string;
  buildId: number;
  imageName: string;
  diffName: string;
  status: TestStatus;
  testVariation: TestVariation;
}
