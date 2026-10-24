import { expect, Page } from "@playwright/test";
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import type { IgnoreArea } from "~client/types/ignoreArea";
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
// the size of the screenshots the runs are mocked with
const IMAGE = { width: 1280, height: 720 };

const openRunWith = async (
  page: Page,
  openProjectPage: (id: string, buildId: string, testId: string) => unknown,
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

  await openProjectPage(project.id, build.id, run.id);

  // the checkpoint is the pane the areas are edited on. The image is shown
  // scaled down to fit, so image pixels are turned into page pixels here.
  const canvas = page.getByTestId("drawArea").last().locator("canvas").last();
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  const scale = box.width / IMAGE.width;
  return (x: number, y: number) => ({
    x: box.x + x * scale,
    y: box.y + y * scale,
  });
};

const drag = async (
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) => {
  // Firefox loses the pointer outside the window and never sees it released,
  // so the move stops at the window's edge — past the image all the same
  const viewport = page.viewportSize();
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(
    Math.min(Math.max(to.x, 0), viewport.width - 1),
    Math.min(Math.max(to.y, 0), viewport.height - 1),
    { steps: 10 },
  );
  await page.mouse.up();
};

const saveIgnoreAreas = async (page: Page) => {
  const request = page.waitForRequest(
    `${API_URL}/test-runs/ignoreAreas/update`,
  );
  await page.route(`${API_URL}/test-runs/ignoreAreas/update`, (route) =>
    route.fulfill({ status: 200, body: "{}" }),
  );
  await page.locator('[data-testid="SaveIcon"]').click();
  return (await request).postDataJSON().ignoreAreas as IgnoreArea[];
};

// An ignore area only means something on the screenshot it covers. A handle
// pulled past the image used to take the area with it, leaving it hanging off
// the picture — and one pulled past the top or left edge saved a negative
// position, which masks pixels on the wrong rows when the images are compared.
test("stops an area resized past the bottom-right of the image at its border", async ({
  openProjectPage,
  page,
}) => {
  const area = { id: "1", x: 1100, y: 600, width: 100, height: 80 };
  const toPage = await openRunWith(page, openProjectPage, [area]);

  await page.mouse.click(
    toPage(area.x + area.width / 2, area.y + area.height / 2).x,
    toPage(area.x + area.width / 2, area.y + area.height / 2).y,
  );
  const corner = toPage(area.x + area.width, area.y + area.height);
  await drag(page, corner, { x: corner.x + 200, y: corner.y + 200 });

  expect(await saveIgnoreAreas(page)).toEqual([
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
  const toPage = await openRunWith(page, openProjectPage, [area]);

  await page.mouse.click(
    toPage(area.x + area.width / 2, area.y + area.height / 2).x,
    toPage(area.x + area.width / 2, area.y + area.height / 2).y,
  );
  const corner = toPage(area.x, area.y);
  await drag(page, corner, { x: corner.x - 200, y: corner.y - 200 });

  expect(await saveIgnoreAreas(page)).toEqual([
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
  const toPage = await openRunWith(page, openProjectPage, []);

  await page.locator('button[value="drawMode"]').click();
  // just inside the bottom-right corner, where the smallest area there is
  // already reaches past the border
  const corner = toPage(IMAGE.width - 1, IMAGE.height - 1);
  await page.mouse.click(corner.x - 1, corner.y - 1);

  const [drawn] = await saveIgnoreAreas(page);
  expect(drawn.x + drawn.width).toBeLessThanOrEqual(IMAGE.width);
  expect(drawn.y + drawn.height).toBeLessThanOrEqual(IMAGE.height);
  expect(drawn.width).toBeGreaterThan(0);
  expect(drawn.height).toBeGreaterThan(0);
});

// The areas the run was compared with are only shown, but they are drawn over
// the ones being edited and used to take the pointer: an ignore area under
// one could be neither selected nor moved, and its handles could not be held.
test("lets an area under the compared run's areas be selected and moved", async ({
  openProjectPage,
  page,
}) => {
  const area = { id: "1", x: 200, y: 200, width: 100, height: 80 };
  const toPage = await openRunWith(
    page,
    openProjectPage,
    [area],
    [{ x: 100, y: 100, width: 600, height: 400 }],
  );

  const center = toPage(area.x + area.width / 2, area.y + area.height / 2);
  await page.mouse.click(center.x, center.y);
  const moved = toPage(
    area.x + area.width / 2 + 100,
    area.y + area.height / 2 + 50,
  );
  await drag(page, center, moved);

  const [saved] = await saveIgnoreAreas(page);
  expect(saved.x).toBeCloseTo(area.x + 100, -1);
  expect(saved.y).toBeCloseTo(area.y + 50, -1);
});
