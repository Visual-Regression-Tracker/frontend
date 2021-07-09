import { TestRun } from "./testRun";
import { User } from "./user";

export interface Baseline {
  id: string;
  baselineName: string;
  testRunId: string;
  testVariationId: string;
  createdAt: string;
  updatedAt: string;
  testRun: TestRun;
  user: User;
}
