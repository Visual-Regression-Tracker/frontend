import { expect } from "@playwright/test";
import { ProjectPage } from "pages";
import { seedUser } from "fixtures";
import { test } from "./fixtures";

test.beforeEach(async ({ page, admin }) => {
  await seedUser(page, admin);
});

test("approves a run posted through the API", async ({
  page,
  api,
  project,
}) => {
  const build = await api.startBuild(project.id);
  const run = await api.postTestRun(build, "home page");
  expect(run.status).toBe("new");

  await page.goto(`/${project.id}?buildId=${build.id}&testId=${run.id}`);
  const { detailsDialog, details } = new ProjectPage(page);
  await expect(detailsDialog.getByText("new", { exact: true })).toBeVisible();

  await details.approve.click();

  await expect(
    detailsDialog.getByText("approved", { exact: true }),
  ).toBeVisible();
});

test("shows a run posted to the open build without a reload", async ({
  page,
  api,
  project,
}) => {
  const build = await api.startBuild(project.id);
  await api.postTestRun(build, "first screen");

  await page.goto(`/${project.id}?buildId=${build.id}`);
  const { testRunList } = new ProjectPage(page);
  await expect(testRunList.rowNames.getByText("first screen")).toBeVisible();

  await api.postTestRun(build, "second screen");

  await expect(testRunList.rowNames.getByText("second screen")).toBeVisible();
});
