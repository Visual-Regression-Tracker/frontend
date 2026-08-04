import { TestRun } from "../types";
import { TestStatus } from "../types/testStatus";

// spelled out here rather than taken from test.data.helper: that module does not
// type check, and naming every axis keeps the grouping inputs obvious
const BASE: TestRun = {
  id: "run",
  buildId: "build",
  imageName: "image.png",
  diffName: "diff.png",
  diffPercent: 1,
  diffTollerancePercent: 0,
  status: TestStatus.unresolved,
  testVariationId: "variation",
  name: "Screen A",
  baselineName: "baseline.png",
  os: "iOS",
  browser: "safari",
  viewport: "375x812",
  device: "iPhone",
  customTags: "en_US",
  ignoreAreas: "[]",
  tempIgnoreAreas: "[]",
  branchName: "main",
  baselineBranchName: "main",
  merge: false,
};

export const run = (overrides: Partial<TestRun> = {}): TestRun => ({
  ...BASE,
  ...overrides,
});
