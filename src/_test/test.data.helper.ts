import { Project, TestRun, TestVariation, User } from "../types";
import { TestStatus } from "../types/testStatus";

export const PROJECT_ONE: Project = {
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

export const TEST_VARIATION_ONE: TestVariation = {
  id: "testVariationId",
  name: "test run name",
  baselineName: "baselineName.png",
  os: "OS",
  browser: "browser",
  viewport: "viewport",
  device: "device",
  ignoreAreas: "[]",
  comment: "some comment",
  branchName: "branch name",
  projectId: PROJECT_ONE.id,
  baselines: [
    {
      id: "some baseline id1",
      baselineName: "baseline1.png",
      testRunId: "testRunId1",
      testVariationId: "some test variation id",
      createdAt: "2020-09-14T06:57:25.845Z",
      updatedAt: "2020-09-14T06:57:25.845Z",
      testRun: testRunMock,
    },
    {
      id: "some baseline id2",
      baselineName: "baseline2.png",
      testRunId: "testRunId2",
      testVariationId: "some test variation id",
      createdAt: "2020-09-12T06:57:25.845Z",
      updatedAt: "2020-09-12T06:57:25.845Z",
      testRun: testRunMock,
    },
  ],
};

export const TEST_VARIATION_TWO: TestVariation = {
  id: "some test variation id2",
  name: "test run name2",
  baselineName: "baseline2.png",
  os: "OS",
  browser: "browser",
  viewport: "viewport",
  device: "device",
  ignoreAreas: "[]",
  comment: "some comment",
  branchName: "branch name",
  projectId: PROJECT_ONE.id,
  baselines: [
    {
      id: "some baseline id1",
      baselineName: "baseline1.png",
      testRunId: "testRunId1",
      testVariationId: "some test variation id",
      createdAt: "2020-09-14T06:57:25.845Z",
      updatedAt: "2020-09-14T06:57:25.845Z",
      testRun: testRunMock,
    },
    {
      id: "some baseline id2",
      baselineName: "baseline2.png",
      testRunId: "testRunId2",
      testVariationId: "some test variation id",
      createdAt: "2020-09-12T06:57:25.845Z",
      updatedAt: "2020-09-12T06:57:25.845Z",
      testRun: testRunMock,
    },
  ],
};
