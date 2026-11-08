import { expect, Page } from "@playwright/test";
import { OpenProjectPage, test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import type { IgnoreArea, UpdateIgnoreAreaDto } from "~client/types/ignoreArea";
import {
  API_URL,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockTestRun,
} from "utils/mocks";
import { boxOf } from "utils/boxOf";
import { postData } from "utils/postData";
import type { TestDetailsDialog } from "pages/TestDetailsDialog";

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;
const IMAGE = { width: 1280, height: 720 };

const openRunWith = async (
  page: Page,
  openProjectPage: OpenProjectPage,
  ignoreAreas: IgnoreArea[],
  tempIgnoreAreas: Omit<IgnoreArea, "id">[] = [],
) => {
  const run = {
    ...TEST_UNRESOLVED,
    ignoreAreas: JSON.stringify(ignoreAreas),
    tempIgnoreAreas: JSON.stringify(tempIgnoreAreas),
  };
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [build]);
  await mockGetBuildDetails(page, build);
  await mockGetTestRuns(page, build.id, [run]);
  await mockTestRun(page, run);
  await mockImage(page, "image.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "baseline.png");

  const { details } = await openProjectPage(project.id, build.id, run.id);
  await details.editAreas.click();

  await expect(details.lastCanvas).toBeVisible();
  const box = await boxOf(details.lastCanvas);
  const scale = box.width / IMAGE.width;
  const toPage = (x: number, y: number) => ({
    x: box.x + x * scale,
    y: box.y + y * scale,
  });

  return { details, toPage };
};

const saveIgnoreAreas = async (page: Page, details: TestDetailsDialog) => {
  const request = page.waitForRequest(
    `${API_URL}/test-runs/ignoreAreas/update`,
  );
  await page.route(`${API_URL}/test-runs/ignoreAreas/update`, (route) =>
    route.fulfill({ status: 200, body: "{}" }),
  );
  await details.saveAreas.click();
  return postData<UpdateIgnoreAreaDto>(await request).ignoreAreas;
};

test("stops an area resized past the bottom-right of the image at its border", async ({
  openProjectPage,
  page,
}) => {
  const area = { id: "1", x: 1100, y: 600, width: 100, height: 80 };
  const { toPage, details } = await openRunWith(page, openProjectPage, [area]);

  await details.clickOnPage(
    toPage(area.x + area.width / 2, area.y + area.height / 2),
  );
  const corner = toPage(area.x + area.width, area.y + area.height);
  await details.dragOnPage(corner, { x: corner.x + 200, y: corner.y + 200 });

  expect(await saveIgnoreAreas(page, details)).toEqual([
    {
      ...area,
      width: IMAGE.width - area.x,
      height: IMAGE.height - area.y,
    },
  ]);
});

test("stops an area resized past the top-left of the image at its border", async ({
  openProjectPage,
  page,
}) => {
  const area = { id: "1", x: 40, y: 30, width: 100, height: 80 };
  const { toPage, details } = await openRunWith(page, openProjectPage, [area]);

  await details.clickOnPage(
    toPage(area.x + area.width / 2, area.y + area.height / 2),
  );
  const corner = toPage(area.x, area.y);
  await details.dragOnPage(corner, { x: corner.x - 200, y: corner.y - 200 });

  expect(await saveIgnoreAreas(page, details)).toEqual([
    {
      ...area,
      x: 0,
      y: 0,
      width: area.x + area.width,
      height: area.y + area.height,
    },
  ]);
});

test("keeps an area drawn at the edge of the image inside it", async ({
  openProjectPage,
  page,
}) => {
  const { toPage, details } = await openRunWith(page, openProjectPage, []);

  await details.drawModeToggle.click();
  const corner = toPage(IMAGE.width - 1, IMAGE.height - 1);
  await details.clickOnPage({ x: corner.x - 1, y: corner.y - 1 });

  const [drawn] = await saveIgnoreAreas(page, details);
  expect(drawn.x + drawn.width).toBeLessThanOrEqual(IMAGE.width);
  expect(drawn.y + drawn.height).toBeLessThanOrEqual(IMAGE.height);
  expect(drawn.width).toBeGreaterThan(0);
  expect(drawn.height).toBeGreaterThan(0);
});

test("lets an area under the compared run's areas be selected and moved", async ({
  openProjectPage,
  page,
}) => {
  const area = { id: "1", x: 200, y: 200, width: 100, height: 80 };
  const { toPage, details } = await openRunWith(
    page,
    openProjectPage,
    [area],
    [{ x: 100, y: 100, width: 600, height: 400 }],
  );

  const center = toPage(area.x + area.width / 2, area.y + area.height / 2);
  await details.clickOnPage(center);
  const moved = toPage(
    area.x + area.width / 2 + 100,
    area.y + area.height / 2 + 50,
  );
  await details.dragOnPage(center, moved);

  const [saved] = await saveIgnoreAreas(page, details);
  expect(saved.x).toBeCloseTo(area.x + 100, -1);
  expect(saved.y).toBeCloseTo(area.y + 50, -1);
});
