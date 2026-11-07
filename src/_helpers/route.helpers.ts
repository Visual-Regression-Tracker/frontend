import { matchPath } from "react-router-dom";
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

interface QueryParams {
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

export const buildVariationListUrl = (projectId: string) =>
  `${routes.VARIATION_LIST_PAGE}/${projectId}`;

const buildProjectStatisticsUrl = (projectId: string) =>
  `${routes.PROJECT_STATISTICS_PAGE}/${projectId}`;

export const buildProjectSettingsUrl = (projectId: string) =>
  `${routes.PROJECT_SETTINGS_PAGE}/${projectId}`;

export type ProjectTab = "builds" | "variations" | "statistics" | "settings";

export type ShellRoute =
  | { kind: "project"; projectId: string; tab: ProjectTab }
  | { kind: "variation" }
  | { kind: "users" }
  | { kind: "profile" };

const FIRST_SEGMENTS_OF_OTHER_PAGES = new Set(
  Object.values(routes)
    .filter((path) => path !== routes.HOME)
    .map((path) => path.split("/")[1]),
);

export const matchShellRoute = (pathname: string): ShellRoute | undefined => {
  if (matchPath(routes.USER_LIST_PAGE, pathname)) {
    return { kind: "users" };
  }
  if (matchPath(routes.PROFILE_PAGE, pathname)) {
    return { kind: "profile" };
  }
  if (
    matchPath(`${routes.VARIATION_DETAILS_PAGE}/:testVariationId`, pathname)
  ) {
    return { kind: "variation" };
  }
  const tabs: [string, ProjectTab][] = [
    [routes.PROJECT_SETTINGS_PAGE, "settings"],
    [routes.PROJECT_STATISTICS_PAGE, "statistics"],
    [routes.VARIATION_LIST_PAGE, "variations"],
  ];
  for (const [path, tab] of tabs) {
    const projectId = matchPath(`${path}/:projectId`, pathname)?.params
      .projectId;
    if (projectId) {
      return { kind: "project", projectId, tab };
    }
  }
  const projectId = matchPath(`${routes.HOME}:projectId`, pathname)?.params
    .projectId;
  if (projectId && !FIRST_SEGMENTS_OF_OTHER_PAGES.has(projectId)) {
    return { kind: "project", projectId, tab: "builds" };
  }
  return undefined;
};

export const buildProjectTabUrl = (tab: ProjectTab, projectId: string) => {
  switch (tab) {
    case "variations":
      return buildVariationListUrl(projectId);
    case "statistics":
      return buildProjectStatisticsUrl(projectId);
    case "settings":
      return buildProjectSettingsUrl(projectId);
    default:
      return buildProjectPageUrl(projectId);
  }
};
