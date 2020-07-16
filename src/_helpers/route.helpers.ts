import { TestRun, TestVariation } from "../types";
import { routes } from "../constants";

export const buildTestRunUrl = (
  testVariation: TestVariation,
  testRun: TestRun
) =>
  `${routes.HOME}${testVariation.projectId}?buildId=${testRun.buildId}&testId=${testRun.id}`;

export const buildTestRunLocation = (testRun: TestRun) => ({
  search: `buildId=${testRun.buildId}&testId=${testRun.id}`,
});

export const buildBuildPageUrl = (projectId: string, buildId: string) =>
  `${routes.HOME}${projectId}?buildId=${buildId}`;
