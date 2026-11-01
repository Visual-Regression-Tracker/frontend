import { Page, Route } from "@playwright/test";
import type {
  Build,
  Project,
  TestRun,
  TestVariation,
  User,
} from "~client/types";

export const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:4200";

export const mockGetProjects = async (page: Page, projects: Project[]) => {
  return page.route(`${API_URL}/projects`, (route, request) => {
    if (request.method() == "GET") {
      return route.fulfill({
        body: JSON.stringify(projects),
      });
    }
    return route.fallback();
  });
};

export const mockGetFavoriteProjects = (page: Page, ids: string[]) => {
  return page.route(`${API_URL}/projects/favorites`, (route, request) => {
    if (request.method() === "GET") {
      return route.fulfill({ body: JSON.stringify(ids) });
    }
    return route.fallback();
  });
};

export const mockToggleFavoriteProject = (page: Page) => {
  return page.route(`${API_URL}/projects/*/favorite`, (route) =>
    route.fulfill({ status: 204 }),
  );
};

export const mockSaveProject = async (page: Page) => {
  return page.route(`${API_URL}/projects`, (route, request) => {
    if (request.method() === "POST" || request.method() === "PUT") {
      const project = request.postDataJSON();
      return route.fulfill({
        body: JSON.stringify({
          ...project,
          id: project.id || "createdProjectId",
          createdAt: "2020-09-14T06:57:25.845Z",
          updatedAt: "2020-09-14T06:57:25.845Z",
        }),
      });
    }
    return route.fallback();
  });
};

export const mockApiError = async (
  page: Page,
  url: string | ((url: URL) => boolean),
  status: number,
  message = "Internal server error",
) => {
  return page.route(url, (route) =>
    route.fulfill({
      status,
      body: JSON.stringify({ statusCode: status, message }),
    }),
  );
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
      const ciBuildId = params.get("ciBuildId");
      const matching = ciBuildId
        ? builds.filter((build) =>
            build.ciBuildId?.toLowerCase().includes(ciBuildId.toLowerCase()),
          )
        : builds;

      // like the API: the page holding that build, else the requested skip
      const around = params.get("aroundBuildId");
      const index = around
        ? matching.findIndex((build) => build.id === around)
        : -1;
      const skip =
        index < 0
          ? Number(params.get("skip"))
          : Math.floor(index / take) * take;

      return route.fulfill({
        body: JSON.stringify({
          data: matching.slice(skip, skip + take),
          skip,
          take,
          total: matching.length,
        }),
      });
    },
  );
};

export const mockDeleteBuilds = async (page: Page) => {
  return page.route(
    (url) => /^\/builds\/[^/]+$/.test(url.pathname),
    (route, request) =>
      request.method() === "DELETE"
        ? route.fulfill({ body: JSON.stringify({}) })
        : route.fallback(),
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

export const mockTestRunsWithDetails = async (
  page: Page,
  buildId: string,
  testRuns: TestRun[],
) => {
  await mockGetTestRuns(page, buildId, testRuns);
  await Promise.all(testRuns.map((testRun) => mockTestRun(page, testRun)));
};

// one route: mockTestRunsWithDetails adds one per run, too many for thousands
export const mockAllTestRunDetails = (page: Page, testRuns: TestRun[]) => {
  const byId = new Map(testRuns.map((testRun) => [testRun.id, testRun]));
  return page.route(
    (url) =>
      url.origin === API_URL && /^\/test-runs\/[^/]+$/.test(url.pathname),
    (route, request) => {
      const testRun = byId.get(new URL(request.url()).pathname.split("/")[2]);
      return request.method() === "GET" && testRun
        ? route.fulfill({ body: JSON.stringify(testRun) })
        : route.fallback();
    },
  );
};

export const mockEveryImage = (page: Page, image: string) => {
  return page.route(
    (url) => url.origin === API_URL && url.pathname.startsWith("/images/"),
    (route) =>
      route.fulfill({
        path: `integration_tests/images/${image}`,
        headers: { "cache-control": "max-age=3600" },
      }),
  );
};

export const mockImage = async (page: Page, name: string, file = name) => {
  const fulfillWithImage = (route: Route) =>
    route.fulfill({
      path: `integration_tests/images/${file}`,
    });

  // displayed through a redirect to storage, downloaded as bytes: two routes
  await page.route(`${API_URL}/images/${name}`, fulfillWithImage);
  return page.route(`${API_URL}/images/${name}/download`, fulfillWithImage);
};

export const mockUpdateUser = async (page: Page, user: object) => {
  return page.route(`${API_URL}/users`, (route, request) =>
    request.method() === "PUT"
      ? route.fulfill({
          body: JSON.stringify({ ...user, ...request.postDataJSON() }),
        })
      : route.fallback(),
  );
};

export const mockChangePassword = async (page: Page) => {
  return page.route(`${API_URL}/users/password`, (route) =>
    route.fulfill({ body: JSON.stringify(true) }),
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

export const mockDeleteTestVariation = async (
  page: Page,
  testVariation: TestVariation,
) => {
  // decoded: ids may hold spaces
  return page.route(
    (url) =>
      decodeURIComponent(url.pathname) ===
      `/test-variations/${testVariation.id}`,
    (route, request) =>
      request.method() === "DELETE"
        ? route.fulfill({ body: JSON.stringify(testVariation) })
        : route.fallback(),
  );
};

export const mockOllamaModels = (page: Page, names: string[]) => {
  return page.route(`${API_URL}/ollama/models`, (route) =>
    route.fulfill({
      body: JSON.stringify({ models: names.map((name) => ({ name })) }),
    }),
  );
};

export const mockDinov2Status = (
  page: Page,
  status: { configured: boolean; available: boolean },
) => {
  return page.route(`${API_URL}/dinov2/status`, (route) =>
    route.fulfill({ body: JSON.stringify(status) }),
  );
};

export const mockUpdateIgnoreAreas = (page: Page) => {
  return page.route(`${API_URL}/test-runs/ignoreAreas/update`, (route) =>
    route.fulfill({ body: "{}" }),
  );
};

export const mockAddIgnoreAreas = (page: Page) => {
  return page.route(`${API_URL}/test-runs/ignoreAreas/add`, (route) =>
    route.fulfill({ body: "{}" }),
  );
};

export const mockUpdateTestRun = (page: Page, testRun: TestRun) => {
  return page.route(`${API_URL}/test-runs/update/${testRun.id}`, (route) =>
    route.fulfill({ body: JSON.stringify(testRun) }),
  );
};

export const mockApproveTestRuns = (page: Page) => {
  return page.route(
    (url) => url.pathname === "/test-runs/approve",
    (route) => route.fulfill({ body: "[]" }),
  );
};

export const mockRejectTestRuns = (page: Page) => {
  return page.route(`${API_URL}/test-runs/reject`, (route) =>
    route.fulfill({ body: "[]" }),
  );
};

export const mockMatchingVariations = (
  page: Page,
  testRunId: string,
  variations: TestRun[],
  skipped: (TestRun & { reason: string })[] = [],
) => {
  return page.route(
    `${API_URL}/test-runs/matchingSiblings/${testRunId}`,
    (route) => route.fulfill({ body: JSON.stringify({ variations, skipped }) }),
  );
};

export const mockMergeTestVariations = async (page: Page, build: Build) => {
  return page.route(
    (url) => url.pathname === "/test-variations/merge",
    (route) => route.fulfill({ body: JSON.stringify(build) }),
  );
};

// appended to the real env-config.js, which the app reads once on load
export const mockEnvConfig = (
  page: Page,
  overrides: Record<string, string>,
) => {
  return page.route("**/env-config.js", async (route) => {
    const response = await route.fetch();
    const assignments = Object.entries(overrides)
      .map(([key, value]) => `window._env_.${key} = ${JSON.stringify(value)};`)
      .join("\n");
    return route.fulfill({
      response,
      body: `${await response.text()}\n${assignments}`,
    });
  });
};

const mockUsersFlag = (page: Page, name: string, enabled: boolean) => {
  return page.route(`${API_URL}/users/${name}/enabled`, (route) =>
    route.fulfill({ body: JSON.stringify(enabled) }),
  );
};

export const mockOidcEnabled = (page: Page, enabled: boolean) =>
  mockUsersFlag(page, "oidc", enabled);

// without this mock the app treats registration as on, like an older backend
export const mockRegistrationEnabled = (page: Page, enabled: boolean) =>
  mockUsersFlag(page, "registration", enabled);

export const mockOidcProvider = (page: Page) => {
  return page.route(`${API_URL}/users/oidc/login`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Identity provider</h1>",
    }),
  );
};

export const mockGetMe = (page: Page, user: object) => {
  return page.route(`${API_URL}/users/me`, (route) =>
    route.fulfill({ body: JSON.stringify(user) }),
  );
};

export const mockLogin = (page: Page, user: object) => {
  return page.route(`${API_URL}/users/login`, (route) =>
    route.fulfill({ body: JSON.stringify(user) }),
  );
};

export const mockDeleteUsers = (page: Page) => {
  return page.route(`${API_URL}/users`, (route, request) =>
    request.method() === "DELETE"
      ? route.fulfill({ body: JSON.stringify(true) })
      : route.fallback(),
  );
};

export const mockUpdateBuild = (page: Page, build: Build) => {
  return page.route(`${API_URL}/builds/${build.id}`, (route, request) =>
    request.method() === "PATCH"
      ? route.fulfill({
          body: JSON.stringify({ ...build, ...request.postDataJSON() }),
        })
      : route.fallback(),
  );
};
