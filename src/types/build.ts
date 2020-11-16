import { TestRun } from "./testRun";
import { BuildStatus } from "./buildStatus";

export interface Build {
  id: string;
  ciBuildId: string;
  number: number;
  projectName: string;
  branchName: string;
  status: BuildStatus;
  createdAt: string;
  createdBy: string;
  testRuns: TestRun[];

  // stats
  unresolvedCount: number;
  passedCount: number;
  failedCount: number;
  isRunning: boolean;
}
