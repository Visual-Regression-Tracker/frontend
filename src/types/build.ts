import { TestRun } from "./testRun";

export interface Build {
  id: string;
  projectName: string;
  branchName: string;
  status: string;
  createdAt: Date;
  createdBy: string;
  testRuns: TestRun[];

  // stats
  unresolvedCount: number;
  passedCount: number;
  failedCount: number;
}
