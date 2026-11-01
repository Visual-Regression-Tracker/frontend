import { routes } from "../constants";

export const buildProjectPageUrl = (projectId: string) =>
  `${routes.HOME}${projectId}`;

export const buildTestRunLocation = (buildId?: string, testRunId?: string) => {
  if (!buildId) {
    return { search: "" };
  }
  return {
    search: testRunId
      ? `buildId=${buildId}&testId=${testRunId}`
      : `buildId=${buildId}`,
  };
};

export interface QueryParams {
  buildId?: string;
  testId?: string;
}

export const getQueryParams = (query: string): QueryParams => {
  const params = new URLSearchParams(query);
  return {
    buildId: params.get("buildId") ?? undefined,
    testId: params.get("testId") ?? undefined,
  };
};
