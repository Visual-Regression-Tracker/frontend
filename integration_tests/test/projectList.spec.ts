import { expect, Page, Request } from "@playwright/test";
import { test } from "fixtures";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import {
  DEFAULT_NOISE_ANALYSIS_CONFIG,
  ODIFF_DEFAULT_CONFIG,
} from "~client/constants/project";
import { ImageComparison } from "~client/types/imageComparison";
import { AddProjectPage, ProjectListPage } from "pages";
import { ProjectSettingsPage } from "pages/ProjectSettingsPage";
import type { NoiseAnalysisConfig, Project, ProjectDto } from "~client/types";
import {
  API_URL,
  mockDeleteProject,
  mockDinov2Status,
  mockGetBuilds,
  mockGetFavoriteProjects,
  mockGetProjects,
  mockSaveProject,
  mockToggleFavoriteProject,
} from "utils/mocks";
import { boxOf } from "utils/boxOf";
import { postData } from "utils/postData";
import { waitForPage } from "utils/waitForPage";

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockDinov2Status(page, { configured: true, available: true });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test("renders", async ({ projectListPage, page }) => {
  await waitForPage(page);
  await expect(page).toHaveScreenshot("projects-list-page.png");
});

test("can delete project", async ({ projectListPage, page }) => {
  await mockDeleteProject(page, project);

  await projectListPage.deleteBtn.click();
  await projectListPage.modal.confirmBtn.click();

  await expect(projectListPage.notification.message).toHaveText(
    "Project name deleted",
  );
});

test("can dismiss a notification without waiting it out", async ({
  projectListPage,
  page,
}) => {
  await mockDeleteProject(page, project);

  await projectListPage.deleteBtn.click();
  await projectListPage.modal.confirmBtn.click();
  await expect(projectListPage.notification.message).toBeVisible();

  await projectListPage.notification.dismissBtn.click();

  // shorter than autoHideDuration, so waiting the toast out cannot pass
  await expect(projectListPage.notification.message).toBeHidden({
    timeout: 1000,
  });
});

test("stacks at most three notifications, centred at the bottom", async ({
  projectListPage,
  page,
}) => {
  const projects = ["a", "b", "c", "d"].map((id) => ({
    ...project,
    id,
    name: `Project ${id}`,
  }));
  await mockGetProjects(page, projects);
  for (const listed of projects) {
    await mockDeleteProject(page, listed);
  }
  await page.reload();
  await expect(projectListPage.deleteBtn).toHaveCount(4);

  for (const listed of projects) {
    await projectListPage.deleteBtn.first().click();
    await projectListPage.modal.confirmBtn.click();
    await expect(
      projectListPage.notification.toast(`${listed.name} deleted`),
    ).toBeVisible();
  }

  const toasts = page.locator(".notistack-MuiContent");
  await expect(toasts).toHaveCount(3);
  const box = await boxOf(toasts.first());
  const viewport = page.viewportSize();
  expect(box.x + box.width / 2).toBeCloseTo((viewport?.width ?? 0) / 2, -1);
  expect(box.y).toBeGreaterThan((viewport?.height ?? 0) / 2);
});

test("offers the group by axis with bulk approve off", async ({
  projectSettingsPage,
}) => {
  await expect(
    projectSettingsPage.page.getByRole("combobox", { name: "Variation axis" }),
  ).toBeVisible();
});

test("opens the add project page from the list", async ({
  projectListPage,
  page,
}) => {
  await projectListPage.addBtn.click();

  await expect(page).toHaveURL(/\/projects\/new$/);
  await expect(new AddProjectPage(page).heading).toBeVisible();
  await expect(projectListPage.modal.dialog).toHaveCount(0);
});

test("creates a project and opens it", async ({ addProjectPage, page }) => {
  await mockSaveProject(page);
  await mockGetBuilds(page, "createdProjectId", []);

  await addProjectPage.name.fill("New project");
  await addProjectPage.mainBranch.fill("main");
  await addProjectPage.buildCount.fill("10");
  await addProjectPage.maxBranchLifetime.fill("7");
  await addProjectPage.autoApprove.uncheck();
  await addProjectPage.selectImageComparison(ImageComparison.odiff);

  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/projects` && request.method() === "POST",
    ),
    addProjectPage.createBtn.click(),
  ]);

  expect(request.postDataJSON()).toMatchObject({
    name: "New project",
    mainBranchName: "main",
    maxBuildAllowed: 10,
    maxBranchLifetime: 7,
    autoApproveFeature: false,
    imageComparison: ImageComparison.odiff,
    imageComparisonConfig: ODIFF_DEFAULT_CONFIG,
  });
  await expect(addProjectPage.notification.message).toHaveText(
    "New project created",
  );
  await expect(page).toHaveURL(/\/createdProjectId$/);
});

test("does not create a project with too short a name", async ({
  addProjectPage,
  page,
}) => {
  const creates: string[] = [];
  page.on("request", (request) => {
    if (
      request.url() === `${API_URL}/projects` &&
      request.method() === "POST"
    ) {
      creates.push(request.url());
    }
  });

  await addProjectPage.name.fill("N");
  await addProjectPage.mainBranch.fill("main");
  await addProjectPage.createBtn.click();

  await expect(page.getByText("Enter at least two characters.")).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/new$/);
  expect(creates).toEqual([]);
});

test("cancels adding a project", async ({ addProjectPage, page }) => {
  await addProjectPage.cancelBtn.click();

  await expect(page).toHaveURL(/\/projects$/);
});

test("edits a project", async ({ projectSettingsPage, page }) => {
  await mockSaveProject(page);
  await expect(projectSettingsPage.name).toHaveValue(project.name);
  await expect(projectSettingsPage.mainBranch).toHaveValue(
    project.mainBranchName,
  );
  await projectSettingsPage.name.fill("Renamed project");

  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/projects` && request.method() === "PUT",
    ),
    projectSettingsPage.saveBtn.click(),
  ]);

  expect(request.postDataJSON()).toMatchObject({
    id: project.id,
    name: "Renamed project",
    mainBranchName: project.mainBranchName,
    maxBuildAllowed: project.maxBuildAllowed,
  });
  await expect(projectSettingsPage.notification.message).toHaveText(
    "Renamed project updated",
  );
  await expect(projectSettingsPage.header.projectCrumb).toHaveText(
    "Renamed project",
  );
});

test("opens the project's settings from the settings button", async ({
  projectListPage,
  page,
}) => {
  await projectListPage.settingsBtn.click();

  await expect(page).toHaveURL(new RegExp(`/settings/${project.id}$`));
  await expect(new ProjectSettingsPage(page).name).toHaveValue(project.name);
});

const named = (
  id: string,
  name: string,
  mainBranchName = "master",
): Project => ({
  ...project,
  id,
  name,
  mainBranchName,
});
const ALPHA = named("alpha-id", "Alpha");
const BETA = named("beta-id", "Beta", "develop");
const GAMMA = named("gamma-id", "Gamma");

const openWith = async (
  page: Page,
  projects: Project[],
  favorites: string[] = [],
  path = "/projects",
) => {
  await mockGetProjects(page, projects);
  await mockGetFavoriteProjects(page, favorites);
  await page.goto(path);
  const projectListPage = new ProjectListPage(page);
  await expect(projectListPage.projects.first()).toBeVisible();
  return projectListPage;
};

test.describe("favourites and search", () => {
  test("stars a project, tells the API and lists it first", async ({
    page,
    authUser,
  }) => {
    void authUser;
    const projectListPage = await openWith(page, [ALPHA, BETA]);
    await mockToggleFavoriteProject(page);

    const [request] = await Promise.all([
      page.waitForRequest(`${API_URL}/projects/${BETA.id}/favorite`),
      projectListPage.starBtn("Beta").click(),
    ]);

    expect(request.method()).toBe("PUT");
    await expect(
      projectListPage
        .section("Favourites")
        .getByRole("heading", { name: "Beta" }),
    ).toBeVisible();
    await expect(projectListPage.starBtn("Beta")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("takes a project out of the favourites", async ({ page, authUser }) => {
    void authUser;
    const projectListPage = await openWith(page, [ALPHA, BETA], [BETA.id]);
    await mockToggleFavoriteProject(page);

    const [request] = await Promise.all([
      page.waitForRequest(`${API_URL}/projects/${BETA.id}/favorite`),
      projectListPage.starBtn("Beta").click(),
    ]);

    expect(request.method()).toBe("DELETE");
    await expect(projectListPage.section("Favourites")).toHaveCount(0);
  });

  test("lists the favourites the API keeps above the other projects", async ({
    page,
    authUser,
  }) => {
    void authUser;
    const projectListPage = await openWith(
      page,
      [ALPHA, BETA, GAMMA],
      [GAMMA.id],
    );

    await expect(
      projectListPage.section("Favourites").getByRole("heading", { level: 3 }),
    ).toHaveText(["Gamma"]);
    await expect(
      projectListPage
        .section("Other projects")
        .getByRole("heading", { level: 3 }),
    ).toHaveText(["Alpha", "Beta"]);
  });

  test("narrows the projects to the search and keeps it in the link", async ({
    page,
    authUser,
  }) => {
    void authUser;
    const projectListPage = await openWith(page, [ALPHA, BETA, GAMMA]);

    await projectListPage.search.fill("develop");

    await expect(projectListPage.projects).toHaveCount(1);
    await expect(projectListPage.project("Beta")).toBeVisible();
    await expect(page).toHaveURL(/[?&]q=develop/);
  });

  test("opens with the search a link carries", async ({ page, authUser }) => {
    void authUser;
    const projectListPage = await openWith(
      page,
      [ALPHA, BETA],
      [],
      "/projects?q=alp",
    );

    await expect(projectListPage.search).toHaveValue("alp");
    await expect(projectListPage.projects).toHaveCount(1);
  });

  test("puts the cursor in the search on /", async ({ page, authUser }) => {
    void authUser;
    const projectListPage = await openWith(page, [ALPHA, BETA]);

    await page.keyboard.press("/");

    await expect(projectListPage.search).toBeFocused();
    await expect(projectListPage.search).toHaveValue("");
  });

  test("opens a project from its name without reloading the app", async ({
    page,
    authUser,
  }) => {
    void authUser;
    const projectListPage = await openWith(page, [ALPHA]);
    await mockGetBuilds(page, ALPHA.id, []);
    // a full page load would start over without this
    await page.evaluate(() => {
      (window as unknown as { kept?: boolean }).kept = true;
    });

    await projectListPage.openLink("Alpha").click();

    await expect(page).toHaveURL(new RegExp(`/${ALPHA.id}$`));
    expect(
      await page.evaluate(() => (window as unknown as { kept?: boolean }).kept),
    ).toBe(true);
  });
});

const savedNoiseConfig = (request: Request): NoiseAnalysisConfig =>
  JSON.parse(
    postData<ProjectDto>(request).noiseAnalysisConfig,
  ) as NoiseAnalysisConfig;

const waitForSave = (page: Page, method: "POST" | "PUT") =>
  page.waitForRequest(
    (request) =>
      request.url() === `${API_URL}/projects` && request.method() === method,
  );

const withNoiseConfig = (config: NoiseAnalysisConfig): Project => ({
  ...project,
  noiseAnalysisConfig: JSON.stringify(config),
});

test.describe("post-analysis settings", () => {
  test("creates a project with the default settings", async ({
    addProjectPage,
    page,
  }) => {
    await mockSaveProject(page);

    await expect(addProjectPage.blurSwitch).not.toBeChecked();
    await expect(addProjectPage.dinov2Switch).not.toBeChecked();
    await expect(addProjectPage.amplitudeThreshold).toHaveValue("80");
    await expect(addProjectPage.solidShareMax).toHaveValue("0.01");
    await expect(addProjectPage.distanceThreshold).toHaveValue("0.15");
    await addProjectPage.name.fill("New project");
    await addProjectPage.mainBranch.fill("main");

    const [request] = await Promise.all([
      waitForSave(page, "POST"),
      addProjectPage.createBtn.click(),
    ]);

    expect(savedNoiseConfig(request)).toEqual(DEFAULT_NOISE_ANALYSIS_CONFIG);
  });

  test("saves the switches and thresholds of an existing project", async ({
    projectSettingsPage,
    page,
  }) => {
    await mockSaveProject(page);
    await projectSettingsPage.amplitudeThreshold.fill("60");
    await projectSettingsPage.solidShareMax.fill("0.02");
    await projectSettingsPage.distanceThreshold.fill("0.3");
    await projectSettingsPage.dinov2Switch.uncheck();

    const [request] = await Promise.all([
      waitForSave(page, "PUT"),
      projectSettingsPage.saveBtn.click(),
    ]);

    expect(savedNoiseConfig(request)).toEqual({
      blur: { enabled: true, amplitudeThreshold: 60, solidShareMax: 0.02 },
      dinov2: { enabled: false, distanceThreshold: 0.3 },
    });
  });

  test("opens a project with the settings it was saved with", async ({
    projectSettingsPage,
    page,
  }) => {
    await mockGetProjects(page, [
      withNoiseConfig({
        blur: { enabled: false, amplitudeThreshold: 55, solidShareMax: 0.05 },
        dinov2: { enabled: true, distanceThreshold: 0.2 },
      }),
    ]);
    await page.reload();

    await expect(projectSettingsPage.blurSwitch).not.toBeChecked();
    await expect(projectSettingsPage.dinov2Switch).toBeChecked();
    await expect(projectSettingsPage.amplitudeThreshold).toHaveValue("55");
    await expect(projectSettingsPage.solidShareMax).toHaveValue("0.05");
    await expect(projectSettingsPage.distanceThreshold).toHaveValue("0.2");
  });

  test("locks the second stage while the first is off", async ({
    projectSettingsPage,
  }) => {
    await expect(projectSettingsPage.dinov2Switch).toBeEnabled();

    await projectSettingsPage.blurSwitch.uncheck();

    await expect(projectSettingsPage.dinov2Switch).toBeDisabled();
    await expect(projectSettingsPage.needsStageOne).toBeVisible();
    await expect(projectSettingsPage.amplitudeThreshold).toBeDisabled();
    await expect(projectSettingsPage.distanceThreshold).toBeDisabled();

    await projectSettingsPage.blurSwitch.check();

    await expect(projectSettingsPage.dinov2Switch).toBeEnabled();
    await expect(projectSettingsPage.needsStageOne).toBeHidden();
  });

  test("is not available with the VLM comparator", async ({
    projectSettingsPage,
  }) => {
    await expect(projectSettingsPage.vlmNote).toBeHidden();

    await projectSettingsPage.selectImageComparison(ImageComparison.vlm);

    await expect(projectSettingsPage.vlmNote).toHaveText(
      "Not available with the VLM comparator",
    );
    await expect(projectSettingsPage.blurSwitch).toBeDisabled();
    await expect(projectSettingsPage.dinov2Switch).toBeDisabled();
    await expect(projectSettingsPage.amplitudeThreshold).toBeDisabled();
    await expect(projectSettingsPage.solidShareMax).toBeDisabled();
    await expect(projectSettingsPage.distanceThreshold).toBeDisabled();

    await projectSettingsPage.selectImageComparison(ImageComparison.odiff);

    await expect(projectSettingsPage.vlmNote).toBeHidden();
    await expect(projectSettingsPage.blurSwitch).toBeEnabled();
  });

  test("says so where the server has no DINOv2 service", async ({
    projectSettingsPage,
    page,
  }) => {
    await mockDinov2Status(page, { configured: false, available: false });

    await expect(projectSettingsPage.dinov2Status).toHaveText(
      "Not available: this server has no DINOv2 service (DINOV2_URL). Runs are judged by the blur stage alone.",
    );
  });

  test("warns when the DINOv2 service is set up but not answering", async ({
    projectSettingsPage,
    page,
  }) => {
    await mockDinov2Status(page, { configured: true, available: false });

    await expect(projectSettingsPage.dinov2Status).toContainText(
      "The DINOv2 service is not answering right now",
    );
  });

  test("shows no DINOv2 note while the service answers", async ({
    projectSettingsPage,
  }) => {
    await expect(projectSettingsPage.dinov2Switch).toBeVisible();

    await expect(projectSettingsPage.dinov2Status).toHaveCount(0);
  });
});
