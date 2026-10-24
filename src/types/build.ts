import { TestRun } from "./testRun";
import { BuildStatus } from "./buildStatus";

export interface Build {
  id: string;
  ciBuildId: string;
  number: number;
  projectId: string;
  projectName: string;
  branchName: string;
  status: BuildStatus;
  createdAt: string;
  // the time of the last run; older API versions leave it out
  updatedAt?: string;
  createdBy: string;
  testRuns: TestRun[];

  // stats
  unresolvedCount: number;
  passedCount: number;
  failedCount: number;
  isRunning: boolean;
  merge: boolean;
}
