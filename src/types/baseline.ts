import { TestRun } from "./testRun";

export interface Baseline {
  id: string;
  baselineName: string;
  testRunId: string;
  testVariationId: string;
  createdAt: Date;
  updatedAt: Date;
  testRun: TestRun;
}
