import { PIXELMATCH_DEFAULT_CONFIG } from "../constants";
import { Build, Project, TestRun, TestVariation, User } from "../types";
import { BuildStatus } from "../types/buildStatus";
import { ImageComparison } from "../types/imageComparison";
import { TestStatus } from "../types/testStatus";

export const TEST_PROJECT: Project = {
  id: "someProjectId",
  name: "Project name",
  mainBranchName: "Main branch name",
  builds: [],
  updatedAt: "2020-09-14T06:57:25.845Z",
  createdAt: "2020-09-14T06:57:25.845Z",
  autoApproveFeature: true,
  imageComparison: ImageComparison.pixelmatch,
  imageComparisonConfig: PIXELMATCH_DEFAULT_CONFIG,
  maxBuildAllowed: 100,
  maxBranchLifetime: 30,
};

export const TEST_USER: User = {
  id: "1",
  token: 123567,
  apiKey: "SOME KEY SECRET",
  email: "some@email.com",
  firstName: "First name",
  lastName: "Last name",
  role: "admin",
};

export const GUEST_USER: User = {
  id: "2",
  token: 123567,
  apiKey: "SOME KEY SECRET",
  email: "guest@email.com",
  firstName: "Guest name",
  lastName: "Guest name",
  role: "guest",
};

export const EDITOR_USER: User = {
  id: "3",
  token: 123567,
  apiKey: "SOME KEY SECRET",
  email: "guest@email.com",
  firstName: "Editor name",
  lastName: "Editor name",
  role: "editor",
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
  customTags: "customTags",
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
  customTags: "customTags",
  ignoreAreas: "[]",
  comment: "some comment",
  branchName: "branch name",
  projectId: TEST_PROJECT.id,
  baselines: [
    {
      id: "some baseline id1",
      baselineName: "baseline1.png",
      testVariationId: "some test variation id",
      createdAt: "2020-09-14T06:57:25.845Z",
      updatedAt: "2020-09-14T06:57:25.845Z",
      testRun: testRunMock,
      user: TEST_USER,
    },
    {
      id: "some baseline id2",
      baselineName: "baseline2.png",
      testVariationId: "some test variation id",
      createdAt: "2020-09-12T06:57:25.845Z",
      updatedAt: "2020-09-12T06:57:25.845Z",
      testRun: testRunMock,
      user: TEST_USER,
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
  customTags: "customTags",
  ignoreAreas: "[]",
  comment: "some comment",
  branchName: "branch name",
  projectId: TEST_PROJECT.id,
  baselines: [
    {
      id: "some baseline id1",
      baselineName: "baseline1.png",
      testVariationId: "some test variation id",
      createdAt: "2020-09-14T06:57:25.845Z",
      updatedAt: "2020-09-14T06:57:25.845Z",
      testRun: testRunMock,
      user: TEST_USER,
    },
    {
      id: "some baseline id2",
      baselineName: "baseline2.png",
      testVariationId: "some test variation id",
      createdAt: "2020-09-12T06:57:25.845Z",
      updatedAt: "2020-09-12T06:57:25.845Z",
      testRun: testRunMock,
      user: TEST_USER,
    },
  ],
};

export const TEST_BUILD_FAILED: Build = {
  id: "someId",
  number: 1,
  ciBuildId: "some build id",
  projectId: TEST_PROJECT.id,
  projectName: "Project name",
  branchName: "Branch name",
  status: BuildStatus.failed,
  createdAt: "2020-09-14T06:57:25.845Z",
  createdBy: "2020-09-14T06:57:25.845Z",
  testRuns: [],
  unresolvedCount: 0,
  passedCount: 2,
  failedCount: 1,
  isRunning: false,
  merge: false,
};

export const TEST_BUILD_PASSED: Build = {
  id: "someId2",
  number: 2,
  ciBuildId: "",
  projectId: TEST_PROJECT.id,
  projectName: "Project name",
  branchName: "Branch name",
  status: BuildStatus.passed,
  createdAt: "2020-09-14T06:57:25.845Z",
  createdBy: "2020-09-14T06:57:25.845Z",
  testRuns: [],
  unresolvedCount: 0,
  passedCount: 2,
  failedCount: 0,
  isRunning: false,
  merge: false,
};

export const TEST_BUILD_UNRESOLVED: Build = {
  id: "someId3",
  number: 3,
  ciBuildId: "",
  projectId: TEST_PROJECT.id,
  projectName: "Project name",
  branchName: "Branch name",
  status: BuildStatus.unresolved,
  createdAt: "2020-09-14T06:57:25.845Z",
  createdBy: "2020-09-14T06:57:25.845Z",
  testRuns: [],
  unresolvedCount: 2,
  passedCount: 0,
  failedCount: 0,
  isRunning: false,
  merge: true,
};

export const TEST_UNRESOLVED: TestRun = {
  id: "some_test_run_id",
  buildId: "some build id",
  imageName: "image.png",
  diffName: "diff.png",
  baselineName: "baseline.png",
  diffPercent: 1.24,
  diffTollerancePercent: 3.21,
  status: TestStatus.unresolved,
  testVariationId: "some test variation id",
  name: "test run name unresolved",
  os: "OS",
  browser: "browser",
  viewport: "viewport",
  device: "device",
  customTags: "customTags",
  ignoreAreas: `[{"id":"1606901916571","x":232,"y":123,"width":166,"height":138}]`,
  tempIgnoreAreas: `[{"x":100,"y":300,"width":600,"height":700}]`,
  comment: "some comment",
  branchName: "branch name",
  baselineBranchName: "baselineBranchName",
  merge: false,
};

export const TEST_RUN_APPROVED: TestRun = {
  id: "some_test_run_id2",
  buildId: "some build id",
  imageName: "imageName",
  diffName: "diffName",
  diffPercent: 1.24,
  diffTollerancePercent: 3.21,
  status: TestStatus.approved,
  testVariationId: "some test variation id",
  name: "test run name2",
  baselineName: "baselineName",
  os: "OS",
  browser: "browser",
  viewport: "viewport",
  device: "device",
  customTags: "customTags",
  ignoreAreas: "[]",
  tempIgnoreAreas: "[]",
  comment: "some comment",
  branchName: "branch name",
  baselineBranchName: "baselineBranchName",
  merge: false,
};

export const TEST_RUN_NEW: TestRun = {
  id: "some_test_run_id3",
  buildId: "some build id",
  imageName: "imageName",
  diffName: "diffName",
  diffPercent: 1.24,
  diffTollerancePercent: 3.21,
  status: TestStatus.new,
  testVariationId: "some test variation id",
  name: "test run name3",
  baselineName: "baselineName",
  os: "",
  browser: "",
  viewport: "",
  device: "",
  customTags: "",
  ignoreAreas: "[]",
  tempIgnoreAreas: "[]",
  comment: "some comment",
  branchName: "branch name",
  baselineBranchName: "baselineBranchName",
  merge: false,
};

export const TEST_RUN_OK: TestRun = {
  id: "some_test_run_id4",
  buildId: "some build id",
  imageName: "imageName",
  diffName: "diffName",
  diffPercent: 1.24,
  diffTollerancePercent: 3.21,
  status: TestStatus.ok,
  testVariationId: "some test variation id",
  name: "test run name4",
  baselineName: "baselineName",
  os: "",
  browser: "",
  viewport: "",
  device: "",
  customTags: "",
  ignoreAreas: "[]",
  tempIgnoreAreas: "[]",
  comment: "some comment",
  branchName: "branch name",
  baselineBranchName: "baselineBranchName",
  merge: false,
};
