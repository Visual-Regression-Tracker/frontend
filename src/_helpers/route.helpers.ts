import { TestRun, TestVariation } from "../types";
import { routes } from "../constants";

export const buildTestRunUrl = (
  testVariation: TestVariation,
  testRun: TestRun
) =>
  `${routes.HOME}${testVariation.projectId}?buildId=${testRun.buildId}&testId=${testRun.id}`;

export const buildTestRunLocation = (buildId: string, testRunId: string) => ({
  search: `buildId=${buildId}&testId=${testRunId}`,
});

export const buildBuildPageUrl = (projectId: string, buildId: string) =>
  `${routes.HOME}${projectId}?buildId=${buildId}`;
