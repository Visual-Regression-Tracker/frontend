import { TestRun, User } from "../types";
import { TestStatus } from "../types/testStatus";

export const userMock: User = {
  id: "1",
  token: 123567,
  apiKey: "SOME KEY SECRET",
  email: "some@email.com",
  firstName: "First name",
  lastName: "Last name",
};

export const testRunApproved: TestRun = {
  id: "some test run id2",
  buildId: "some build id",
  imageName: "screenshot.png",
  diffName: "diff.png",
  baselineName: "baseline.png",
  diffPercent: 1.24,
  diffTollerancePercent: 3.21,
  status: TestStatus.approved,
  testVariationId: "some test variation id",
  name: "test run name2",
  os: "OS",
  browser: "browser",
  viewport: "viewport",
  device: "device",
  ignoreAreas: "[]",
  comment: "some comment",
  branchName: "branch name",
  baselineBranchName: "baselineBranchName",
  merge: false,
};
