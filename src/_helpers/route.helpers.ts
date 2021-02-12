import { TestRun, TestVariation } from "../types";
import { routes } from "../constants";
import qs from "qs";

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

export interface QueryParams {
  buildId?: string;
  testId?: string;
}

export const getQueryParams = (guery: string): QueryParams => {
  const queryParams = qs.parse(guery, { ignoreQueryPrefix: true });
  return {
    buildId: queryParams.buildId as string,
    testId: queryParams.testId as string,
  };
};
