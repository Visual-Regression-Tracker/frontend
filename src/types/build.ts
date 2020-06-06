import { TestRun } from "./testRun";
import { BuildStatus } from "./buildStatus";

export interface Build {
  id: string;
  projectName: string;
  branchName: string;
  status: BuildStatus;
  createdAt: Date;
  createdBy: string;
  testRuns: TestRun[];

  // stats
  unresolvedCount: number;
  passedCount: number;
  failedCount: number;
}
