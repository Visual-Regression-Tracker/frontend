import { Page } from "@playwright/test";
import type {
  Build,
  Project,
  TestRun,
  TestVariation,
  User,
} from "~client/types";

export const API_URL = "http://localhost:4200";

export const mockGetProjects = async (page: Page, projects: Project[]) => {
  return page.route(`${API_URL}/projects`, (route, request) => {
    if (request.method() == "GET") {
      return route.fulfill({
        body: JSON.stringify(projects),
      });
    }
  });
};

export const mockDeleteProject = async (page: Page, project: Project) => {
  return page.route(`${API_URL}/projects/${project.id}`, (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify(project),
    }),
  );
};

export const mockGetBuilds = async (
  page: Page,
  projectId: string,
  builds: Build[],
) => {
  return page.route(
    (url) =>
      url.pathname === "/builds" &&
      url.searchParams.get("projectId") === projectId,
    (route, request) => {
      const params = new URL(request.url()).searchParams;
      const take = Number(params.get("take"));
      const skip = Number(params.get("skip"));

      return route.fulfill({
        body: JSON.stringify({
          data: builds.slice(skip, skip + take),
          skip,
          take,
          total: builds.length,
        }),
      });
    },
  );
};

export const mockGetBuildDetails = async (page: Page, build: Build) => {
  return page.route(`${API_URL}/builds/${build.id}`, (route) =>
    route.fulfill({
      body: JSON.stringify(build),
    }),
  );
};

export const mockGetTestRuns = async (
  page: Page,
  buildId: string,
  testRuns: TestRun[],
) => {
  return page.route(`${API_URL}/test-runs?buildId=${buildId}`, (route) =>
    route.fulfill({
      body: JSON.stringify(testRuns),
    }),
  );
};

export const mockTestRun = async (page: Page, testRun: TestRun) => {
  return page.route(`${API_URL}/test-runs/${testRun.id}`, (route) =>
    route.fulfill({
      body: JSON.stringify(testRun),
    }),
  );
};

export const mockImage = async (page: Page, image: string) => {
  return page.route(`${API_URL}/images/${image}`, (route) =>
    route.fulfill({
      path: `integration_tests/images/${image}`,
    }),
  );
};

export const mockGetUsers = async (page: Page, users: User[]) => {
  return page.route(`${API_URL}/users/all`, (route) =>
    route.fulfill({
      body: JSON.stringify(users),
    }),
  );
};

export const mockGetTestVariations = async (
  page: Page,
  projectId: string,
  testVariations: TestVariation[],
) => {
  return page.route(
    `${API_URL}/test-variations?projectId=${projectId}`,
    (route) =>
      route.fulfill({
        body: JSON.stringify(testVariations),
      }),
  );
};

export const mockGetTestVariationDetails = async (
  page: Page,
  testVariation: TestVariation,
) => {
  return page.route(
    `${API_URL}/test-variations/details/${testVariation.id}`,
    (route) =>
      route.fulfill({
        body: JSON.stringify(testVariation),
      }),
  );
};
