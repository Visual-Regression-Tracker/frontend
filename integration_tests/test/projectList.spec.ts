import { expect } from "@playwright/test";
import { test } from "fixtures";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import { ODIFF_DEFAULT_CONFIG } from "~client/constants/project";
import { ImageComparison } from "~client/types/imageComparison";
import { ProjectListPage } from "pages";
import type { Project } from "~client/types";
import {
  API_URL,
  mockDeleteProject,
  mockGetBuilds,
  mockGetFavoriteProjects,
  mockGetProjects,
  mockSaveProject,
  mockToggleFavoriteProject,
} from "utils/mocks";

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test("renders", async ({ projectListPage, page }) => {
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

  // shorter than autoHideDuration, so waiting the toast out cannot pass this
  await expect(projectListPage.notification.message).toBeHidden({
    timeout: 1000,
  });
});

// TEST_PROJECT leaves bulkApproveVariations off, and the axis it names drives
// the grid's grouping either way, so it has to stay visible and changeable
test("offers the group by axis with bulk approve off", async ({
  projectListPage,
  page,
}) => {
  await projectListPage.editBtn.click();

  await expect(page.getByLabel("Group variations by")).toBeVisible();
});

test("creates a project", async ({ projectListPage, page }) => {
  await mockSaveProject(page);

  await projectListPage.addBtn.click();
  await projectListPage.name.fill("New project");
  await projectListPage.mainBranch.fill("main");
  await projectListPage.buildCount.fill("10");
  await projectListPage.maxBranchLifetime.fill("7");
  await projectListPage.autoApprove.uncheck();
  await projectListPage.selectImageComparison(ImageComparison.odiff);

  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/projects` && request.method() === "POST",
    ),
    projectListPage.modal.confirmBtn.click(),
  ]);

  expect(request.postDataJSON()).toMatchObject({
    name: "New project",
    mainBranchName: "main",
    maxBuildAllowed: 10,
    maxBranchLifetime: 7,
    autoApproveFeature: false,
    imageComparison: ImageComparison.odiff,
    // switching the library swaps in that library's defaults
    imageComparisonConfig: ODIFF_DEFAULT_CONFIG,
  });
  await expect(projectListPage.notification.message).toHaveText(
    "New project created",
  );
  await expect(projectListPage.modal.dialog).toBeHidden();
  await expect(projectListPage.project("New project")).toBeVisible();
});

test("does not create a project with too short a name", async ({
  projectListPage,
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

  await projectListPage.addBtn.click();
  await projectListPage.name.fill("N");
  await projectListPage.mainBranch.fill("main");
  await projectListPage.modal.confirmBtn.click();

  await expect(
    projectListPage.modal.dialog.getByText("Enter at least two characters."),
  ).toBeVisible();
  await expect(projectListPage.modal.dialog).toBeVisible();
  expect(creates).toEqual([]);
});

test("edits a project", async ({ projectListPage, page }) => {
  await mockSaveProject(page);

  await projectListPage.editBtn.click();
  // the form opens on the project as it is
  await expect(projectListPage.name).toHaveValue(project.name);
  await expect(projectListPage.mainBranch).toHaveValue(project.mainBranchName);
  await projectListPage.name.fill("Renamed project");

  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/projects` && request.method() === "PUT",
    ),
    projectListPage.modal.confirmBtn.click(),
  ]);

  expect(request.postDataJSON()).toMatchObject({
    id: project.id,
    name: "Renamed project",
    mainBranchName: project.mainBranchName,
    maxBuildAllowed: project.maxBuildAllowed,
  });
  await expect(projectListPage.notification.message).toHaveText(
    "Renamed project updated",
  );
  await expect(projectListPage.project("Renamed project")).toBeVisible();
  await expect(projectListPage.project(project.name)).toHaveCount(0);
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

// opened straight, with the API's projects and favourites set up first
const openWith = async (
  page: import("@playwright/test").Page,
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

  test("opens a project's builds without reloading the app", async ({
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

    await projectListPage.buildsLink("Alpha").click();

    await expect(page).toHaveURL(new RegExp(`/${ALPHA.id}$`));
    expect(
      await page.evaluate(() => (window as unknown as { kept?: boolean }).kept),
    ).toBe(true);
  });
});
