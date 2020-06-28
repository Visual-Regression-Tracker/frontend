import { TestRun } from "./testRun";

export interface Baseline {
  id: string;
  baselineName: string;
  testRunId: string;
  testVariationId: string;
  createdAt: string;
  updatedAt: string;
  testRun: TestRun;
}
