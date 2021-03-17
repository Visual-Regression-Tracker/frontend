import { routes } from "../constants";
import qs from "qs";

export const buildProjectPageUrl = (projectId: string) =>
  `${routes.HOME}${projectId}`;

export const buildTestRunLocation = (buildId: string, testRunId?: string) => ({
  search: testRunId
    ? `buildId=${buildId}&testId=${testRunId}`
    : `buildId=${buildId}`,
});

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
