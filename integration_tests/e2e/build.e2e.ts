import { expect } from "@playwright/test";
import { ProjectPage } from "pages";
import { seedUser } from "fixtures";
import { test } from "./fixtures";

test.beforeEach(async ({ page, admin }) => {
  await seedUser(page, admin);
});

test("shows a build started for the open project without a reload", async ({
  page,
  api,
  project,
}) => {
  const first = await api.startBuild(project.id);

  await page.goto(`/${project.id}`);
  const { buildList } = new ProjectPage(page);
  await expect(buildList.getBuildItem(first.number)).toBeVisible();

  const second = await api.startBuild(project.id);

  await expect(buildList.getBuildItem(second.number)).toBeVisible();
});
