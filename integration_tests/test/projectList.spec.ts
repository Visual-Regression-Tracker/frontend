import { expect } from "@playwright/test";
import { test } from "fixtures";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import { ODIFF_DEFAULT_CONFIG } from "~client/constants/project";
import { ImageComparison } from "~client/types/imageComparison";
import {
  API_URL,
  mockDeleteProject,
  mockGetProjects,
  mockSaveProject,
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
