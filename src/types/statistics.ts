import { TestStatus } from "./testStatus";

export interface BuildResult {
  id: string;
  number: number | null;
  ciBuildId: string | null;
  branchName: string | null;
  createdAt: string;
  counts: Record<TestStatus, number>;
}
