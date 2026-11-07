import { BuildResult, TestStatus } from "../types";

export const buildResult = (
  number: number,
  counts: Partial<Record<TestStatus, number>> = {},
  branchName: string | null = "branch name",
): BuildResult => ({
  id: `build-${number}`,
  number,
  ciBuildId: null,
  branchName,
  createdAt: "2020-09-14T06:57:25.845Z",
  counts: {
    [TestStatus.new]: 0,
    [TestStatus.unresolved]: 0,
    [TestStatus.failed]: 0,
    [TestStatus.approved]: 0,
    [TestStatus.autoApproved]: 0,
    [TestStatus.ok]: 0,
    ...counts,
  },
});
