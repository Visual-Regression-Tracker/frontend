import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { APIRequestContext, test as base, expect } from "@playwright/test";
import { DEFAULT_PROJECT_EDIT_STATE } from "~client/constants/project";
import type { Build, Project, TestRun, User } from "~client/types";
import { API_URL } from "utils/mocks";

// the backend repo's committed .env seeds this admin
export const ADMIN = {
  email:
    process.env.DEFAULT_USER_EMAIL ?? "visual-regression-tracker@example.com",
  password: process.env.DEFAULT_USER_PASSWORD ?? "123456",
  apiKey: process.env.DEFAULT_USER_API_KEY ?? "DEFAULTUSERAPIKEYTOBECHANGED",
};

const BRANCH = "master";
const IMAGE_BASE64 = readFileSync(
  "integration_tests/images/narrow.png",
).toString("base64");

export class VrtApi {
  constructor(private readonly request: APIRequestContext) {}

  login(): Promise<User> {
    return this.post(
      "/users/login",
      { email: ADMIN.email, password: ADMIN.password },
      {},
    );
  }

  createProject(token: string, name: string): Promise<Project> {
    return this.post(
      "/projects",
      {
        ...DEFAULT_PROJECT_EDIT_STATE,
        id: undefined,
        name,
        mainBranchName: BRANCH,
      },
      { Authorization: `Bearer ${token}` },
    );
  }

  startBuild(projectId: string): Promise<Build> {
    return this.post("/builds", { project: projectId, branchName: BRANCH });
  }

  postTestRun(build: Build, name: string): Promise<TestRun> {
    return this.post("/test-runs", {
      projectId: build.projectId,
      buildId: build.id,
      branchName: BRANCH,
      name,
      imageBase64: IMAGE_BASE64,
    });
  }

  private async post<T>(
    path: string,
    data: object,
    headers: Record<string, string> = { apiKey: ADMIN.apiKey },
  ): Promise<T> {
    const answer = await this.request.post(path, { data, headers });
    expect(answer.ok(), `${path}: ${await answer.text()}`).toBe(true);
    return (await answer.json()) as T;
  }
}

type Fixtures = {
  api: VrtApi;
  admin: User;
  project: Project;
};

export const test = base.extend<Fixtures>({
  api: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ baseURL: API_URL });
    await use(new VrtApi(request));
    await request.dispose();
  },
  admin: async ({ api }, use) => {
    await use(await api.login());
  },
  project: async ({ api, admin }, use, testInfo) => {
    await use(
      await api.createProject(
        admin.token,
        `smoke ${testInfo.title} ${randomUUID()}`,
      ),
    );
  },
});
