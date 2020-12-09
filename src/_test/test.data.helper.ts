import { Project, TestRun, User } from "../types";
import { TestStatus } from "../types/testStatus";

export const projectMock: Project = {
  id: "someProjectId",
  name: "Project name",
  mainBranchName: "Main branch name",
  builds: [],
  updatedAt: "2020-09-14T06:57:25.845Z",
  createdAt: "2020-09-14T06:57:25.845Z",
};

export const userMock: User = {
  id: "1",
  token: 123567,
  apiKey: "SOME KEY SECRET",
  email: "some@email.com",
  firstName: "First name",
  lastName: "Last name",
};

export const testRunMock: TestRun = {
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
  tempIgnoreAreas: "[]",
  comment: "some comment",
  branchName: "branch name",
  baselineBranchName: "baselineBranchName",
  merge: false,
};
