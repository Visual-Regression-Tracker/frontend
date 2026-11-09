import { expect, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import { type OpenProjectPage, test } from "fixtures";
import {
  NOISE_ANALYSIS_CHANGE,
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import { withRegions } from "~client/_test/noiseRegions";
import type { TestRun } from "~client/types";
import {
  API_URL,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockTestRun,
} from "utils/mocks";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;
const FIXTURES = "../../src/_test/fixtures/mask-parity";

// the parity pair: the backend's blur stage keeps 107 of its changed pixels
const LOGIN: TestRun = {
  ...TEST_UNRESOLVED,
  id: "login",
  baselineName: "login-base.png",
  imageName: "login-image.png",
  diffName: "diff.png",
  ignoreAreas: "[]",
  tempIgnoreAreas: "[]",
  noiseAnalysis: null,
};

const translucentPng = () => {
  const png = new PNG({ width: 4, height: 4 });
  png.data.fill(128);
  return PNG.sync.write(png);
};

const open = async (
  openProjectPage: OpenProjectPage,
  page: Page,
  run: TestRun,
) => {
  await mockGetTestRuns(page, build.id, [run]);
  await mockTestRun(page, run);
  const { details } = await openProjectPage(project.id, build.id, run.id);
  await expect(details.drawAreas).toHaveCount(2);
  return details;
};

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockImage(page, "login-base.png", `${FIXTURES}/login-base.png`);
  await mockImage(page, "login-image.png", `${FIXTURES}/login-image.png`);
  await mockImage(page, "diff.png");
});

test("shows the changes the backend's blur stage keeps, computed in a worker from the download route", async ({
  openProjectPage,
  page,
}) => {
  const downloads: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/download")) downloads.push(request.url());
  });
  const details = await open(openProjectPage, page, LOGIN);
  expect(downloads).toEqual([]);

  await details.noiselessMode.click();

  await expect.poll(() => details.keptPixels()).toBe(107);
  await expect(details.noiselessProgress).toBeHidden();
  expect(new Set(downloads)).toEqual(
    new Set([
      `${API_URL}/images/login-base.png/download`,
      `${API_URL}/images/login-image.png/download`,
    ]),
  );
});

test("warns that faint changes may be hidden without DINOv2, and goes back to Diff", async ({
  openProjectPage,
  page,
}) => {
  const details = await open(openProjectPage, page, LOGIN);

  await details.noiselessMode.click();
  await expect(details.noiselessCaveat).toContainText(
    "Faint changes may be hidden.",
  );
  await details.switchToDiff.click();

  await expect(details.diffMode).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => details.shownImage()).toBe("diff.png");
});

test("draws the patches DINOv2 counts as change and warns that it sees a change", async ({
  openProjectPage,
  page,
}) => {
  const patch = { x: 640, y: 80, width: 14, height: 14, weight: 0.4 };
  const details = await open(openProjectPage, page, {
    ...LOGIN,
    noiseAnalysis: withRegions(
      NOISE_ANALYSIS_CHANGE,
      [],
      [patch, { ...patch, x: 0, weight: 0.1 }],
    ),
  });

  await details.noiselessMode.click();

  await expect(details.noiselessCaveat).toContainText(
    "DINOv2 sees a change this view hides.",
  );
  await expect
    .poll(() => details.lockedRects())
    .toEqual([{ x: 640, y: 80, width: 14, height: 14 }]);
});

test("returns from Diff without noise to Diff with D", async ({
  openProjectPage,
  page,
}) => {
  const details = await open(openProjectPage, page, LOGIN);
  await details.noiselessMode.click();
  await expect.poll(() => details.keptPixels()).toBe(107);

  await page.keyboard.press("d");

  await expect(details.diffMode).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => details.shownImage()).toBe("diff.png");
});

test("is unavailable, with the reason, for a semi-transparent image", async ({
  openProjectPage,
  page,
}) => {
  const body = translucentPng();
  for (const name of ["clear-base.png", "clear-image.png"]) {
    await page.route(`${API_URL}/images/${name}**`, (route) =>
      route.fulfill({ body, contentType: "image/png" }),
    );
  }
  const details = await open(openProjectPage, page, {
    ...LOGIN,
    baselineName: "clear-base.png",
    imageName: "clear-image.png",
  });

  await details.noiselessMode.click();

  await expect(
    details.text(
      "Diff without noise: not available for images with semi-transparent pixels.",
    ),
  ).toBeVisible();
  await expect(details.noiselessMode).toBeDisabled();
});
