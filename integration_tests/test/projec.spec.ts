import { expect } from "@playwright/test";

// only what the tests read off the Konva node under the canvas
type KonvaStage = {
  findOne: (selector: string) => {
    opacity: () => number;
    globalCompositeOperation: () => string;
  };
};
import { test } from "fixtures";
import {
  TEST_BUILD_FAILED,
  TEST_BUILD_PASSED,
  TEST_BUILD_UNRESOLVED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
  TEST_RUN_OK,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import {
  mockDeleteBuilds,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockImage,
  mockTestRun,
} from "utils/mocks";

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockGetBuilds(page, project.id, [
    TEST_BUILD_FAILED,
    TEST_BUILD_PASSED,
    TEST_BUILD_UNRESOLVED,
  ]);
  await mockGetBuildDetails(page, TEST_BUILD_FAILED);
  await mockGetTestRuns(page, TEST_BUILD_FAILED.id, [
    TEST_UNRESOLVED,
    TEST_RUN_APPROVED,
    TEST_RUN_NEW,
    TEST_RUN_OK,
  ]);
  // every run's details, so a test can walk to the next screenshot
  await mockTestRun(page, TEST_UNRESOLVED);
  await mockTestRun(page, TEST_RUN_APPROVED);
  await mockTestRun(page, TEST_RUN_NEW);
  await mockTestRun(page, TEST_RUN_OK);
  await mockImage(page, "baseline.png");
  await mockImage(page, "diff.png");
  await mockImage(page, "image.png");
});

test("renders", async ({ openProjectPage, page }) => {
  const projectPage = await openProjectPage(project.id);
  await projectPage.buildList.getBuildLocator(TEST_BUILD_FAILED.number).click();

  await expect(page).toHaveScreenshot("project-page-test-run-list.png");

  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  await expect(page).toHaveScreenshot("project-page-test-run-details.png");
});

test("searches builds by ci build id", async ({ openProjectPage }) => {
  const projectPage = await openProjectPage(project.id);

  await projectPage.buildList.searchInput.fill(TEST_BUILD_FAILED.ciBuildId);

  await expect(
    projectPage.buildList.getBuildLocator(TEST_BUILD_FAILED.number),
  ).toBeVisible();
  await expect(
    projectPage.buildList.getBuildLocator(TEST_BUILD_PASSED.number),
  ).toBeHidden();
});

test("selects every build the search matched and deletes them", async ({
  openProjectPage,
  page,
}) => {
  const builds = Array.from({ length: 25 }, (_, i) => ({
    ...TEST_BUILD_PASSED,
    id: `build-${i}`,
    number: 100 + i,
    ciBuildId: i < 15 ? "release-1" : "main",
  }));
  await mockGetBuilds(page, project.id, builds);
  await mockDeleteBuilds(page);
  const projectPage = await openProjectPage(project.id);

  await projectPage.buildList.searchInput.fill("release-1");
  await expect(projectPage.buildList.getBuildLocator(115)).toBeHidden();

  await projectPage.buildList.selectAll.click();

  // a page holds ten builds, so the other five have to be selected as well
  await expect(projectPage.buildList.deleteSelectedBtn).toHaveAttribute(
    "aria-label",
    "Delete 15 selected",
  );

  await projectPage.buildList.deleteSelectedBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "15 build(s) deleted",
  );
});

test("keeps the search field in place when nothing matches", async ({
  openProjectPage,
}) => {
  const projectPage = await openProjectPage(project.id);
  await expect(
    projectPage.buildList.getBuildLocator(TEST_BUILD_FAILED.number),
  ).toBeVisible();
  const before = await projectPage.buildList.searchInput.boundingBox();

  await projectPage.buildList.searchInput.fill("no such build");
  await expect(projectPage.buildList.emptyMessage).toBeVisible();

  // the select all checkbox has to hold its place, or the field jumps sideways
  expect(await projectPage.buildList.searchInput.boundingBox()).toEqual(before);
});

test("keeps the empty search message inside the sidebar", async ({
  openProjectPage,
  page,
}) => {
  const query = "3".repeat(40);
  await mockGetBuilds(page, project.id, []);
  const projectPage = await openProjectPage(project.id);

  await projectPage.buildList.searchInput.fill(query);

  const message = projectPage.buildList.emptyMessage;
  await expect(message).toHaveText(`No builds match "${query}"`);

  const overflow = await message.evaluate(
    (el) => el.scrollWidth - el.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("scrolls back to the top of the list on page change", async ({
  openProjectPage,
  page,
}) => {
  const builds = Array.from({ length: 25 }, (_, i) => ({
    ...TEST_BUILD_PASSED,
    id: `build-${i}`,
    number: 100 + i,
  }));
  await mockGetBuilds(page, project.id, builds);
  const projectPage = await openProjectPage(project.id);
  await expect(projectPage.buildList.getBuildLocator(100)).toBeVisible();

  await projectPage.buildList.scrollContainer.evaluate((el) =>
    el.scrollTo(0, el.scrollHeight),
  );
  expect(await projectPage.buildList.scrollTop()).toBeGreaterThan(0);

  await projectPage.buildList.goToPage(2);

  await expect(projectPage.buildList.getBuildLocator(110)).toBeVisible();
  expect(await projectPage.buildList.scrollTop()).toBe(0);
});

test("keeps wheel zoom inside the image pane", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();

  // a wheel over the pane but off the artwork must still be handled by the
  // dialog, otherwise the browser zooms the whole page instead
  const prevented = await pane.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const event = new WheelEvent("wheel", {
      deltaY: 120,
      clientX: box.right - 5,
      clientY: box.bottom - 5,
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  });

  expect(prevented).toBe(true);
});

test("zooms with the cursor off the artwork", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();
  const canvas = page.locator("canvas").first();
  const bounds = await pane.boundingBox();

  // shrink the image until it no longer reaches the far side of the pane
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 20);
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 120);
  }

  const shrunk = await canvas.boundingBox();
  expect(shrunk.x + shrunk.width).toBeLessThan(bounds.x + bounds.width - 20);

  // the empty half of the pane has to zoom the image just the same
  await page.mouse.move(bounds.x + bounds.width - 10, bounds.y + 20);
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, -120);
  }

  const grown = await canvas.boundingBox();
  expect(grown.width).toBeGreaterThan(shrunk.width);
});

test("zooms towards the cursor", async ({ openProjectPage, page }) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();

  // zooming in near the right edge has to pull that edge into view; anchoring
  // at the top left would leave the pane scrolled to 0. Only the horizontal
  // axis is checked because the pane grows in height instead of scrolling.
  const scroll = await pane.evaluate(async (el) => {
    const box = el.getBoundingClientRect();

    for (let i = 0; i < 20; i++) {
      el.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: -120,
          clientX: box.right - 20,
          clientY: box.bottom - 20,
          bubbles: true,
          cancelable: true,
        }),
      );
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    return { left: el.scrollLeft, top: el.scrollTop };
  });

  expect(scroll.left).toBeGreaterThan(0);
});

test("holds the zoom buttons to the same limits as the wheel", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();
  const zoomOut = page.getByTestId("ZoomOutIcon");

  for (let i = 0; i < 60; i++) {
    await zoomOut.click();
  }

  // unclamped this shrinks the image to a fraction of a pixel
  const width = await pane.evaluate(
    (el) => (el.firstElementChild as HTMLElement).offsetWidth,
  );
  expect(width).toBeGreaterThan(100);
});

test("eases the zoom out instead of stopping dead", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();

  const widths = await pane.evaluate(async (el) => {
    const canvas = el.querySelector("canvas") as HTMLCanvasElement;
    const box = el.getBoundingClientRect();

    for (let i = 0; i < 20; i++) {
      el.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: -120,
          clientX: box.left + 20,
          clientY: box.top + 20,
          bubbles: true,
          cancelable: true,
        }),
      );
    }

    const samples: number[] = [];

    for (let frame = 0; frame < 12; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      samples.push(Math.round(canvas.getBoundingClientRect().width));
    }

    return samples;
  });

  // jumping straight to the target would make every sample identical
  expect(new Set(widths).size).toBeGreaterThan(3);
});

test("can download images", async ({ openProjectPage, page }) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);

  await projectPage.testRunList.checkRow(TEST_UNRESOLVED.id);
  await projectPage.testRunList.checkRow(TEST_RUN_NEW.id);

  await projectPage.testRunList.downloadBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "2 test runs processed.",
  );
});

test("lines the Project label up with the select under it", async ({
  openProjectPage,
  page,
}) => {
  await openProjectPage(project.id);

  const label = await page.locator("#projectSelect").boundingBox();
  const select = await page.locator("#project-select").boundingBox();

  expect(label.x).toBe(select.x);
});

const openDialogWithoutDiff = async (openProjectPage, page) => {
  const noDiff = { ...TEST_UNRESOLVED, diffName: null };
  await mockGetTestRuns(page, TEST_BUILD_FAILED.id, [noDiff]);
  await mockTestRun(page, noDiff);
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(noDiff.id).click();
  await expect(page.getByTestId("drawArea")).toHaveCount(2);

  return projectPage;
};

// walking to the next screenshot has to land on another run under review:
// a settled one carries no fade to have been forgotten
const openDialogWithNextUnderReview = async (openProjectPage, page) => {
  const next = {
    ...TEST_UNRESOLVED,
    id: "next_unresolved_test_run_id",
    name: `${TEST_UNRESOLVED.name} 2`,
  };
  await mockGetTestRuns(page, TEST_BUILD_FAILED.id, [TEST_UNRESOLVED, next]);
  await mockTestRun(page, next);
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();
  await expect(page.getByTestId("drawArea")).toHaveCount(2);

  return projectPage;
};

const openDialog = async (openProjectPage, page) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();
  // both panes, or a count asserted a moment later proves nothing
  await expect(page.getByTestId("drawArea")).toHaveCount(2);

  return projectPage;
};

// the fade lives on the image pane, so both panes stay and the baseline shows
// through the image rather than replacing it
const overlaidOpacity = (page) =>
  page
    .getByTestId("drawArea")
    .first()
    .evaluate(() => {
      const { Konva } = window as unknown as {
        Konva: { stages: KonvaStage[] };
      };

      return Konva.stages
        .map((stage) => stage.findOne(".overlaid"))
        .find(Boolean)
        .opacity();
    });

const diffSwitch = (page) =>
  page.getByRole("checkbox", { name: "Toggle diff" });

test("keeps both panes and fades the image over the baseline", async ({
  openProjectPage,
  page,
}) => {
  await openDialog(openProjectPage, page);
  await expect(page.getByTestId("overlayOpacity")).toBeVisible();

  await page.getByTestId("overlayOpacity").getByRole("slider").press("Home");

  await expect(page.getByTestId("drawArea")).toHaveCount(2);
  expect(await overlaidOpacity(page)).toBe(0);
});

// the dialog opens on the server's diff whenever there is one, so a fade that
// only worked in the image view would look broken on arrival
test("takes the pane off the diff when the fade is touched", async ({
  openProjectPage,
  page,
}) => {
  await openDialog(openProjectPage, page);
  await expect(diffSwitch(page)).toBeChecked();

  await page.getByTestId("overlayOpacity").getByRole("slider").press("Home");

  await expect(diffSwitch(page)).not.toBeChecked();
});

test("takes the pane off the diff when the blend is turned on", async ({
  openProjectPage,
  page,
}) => {
  await openDialog(openProjectPage, page);

  await page.getByTestId("differenceToggle").click();

  await expect(diffSwitch(page)).not.toBeChecked();
});

test("blends the two as a difference, diff image or not", async ({
  openProjectPage,
  page,
}) => {
  await openDialogWithoutDiff(openProjectPage, page);

  await page.getByTestId("differenceToggle").click();

  expect(
    await page
      .getByTestId("drawArea")
      .first()
      .evaluate(() => {
        const { Konva } = window as unknown as {
          Konva: { stages: KonvaStage[] };
        };

        return Konva.stages
          .map((stage) => stage.findOne(".overlaid"))
          .find(Boolean)
          .globalCompositeOperation();
      }),
  ).toBe("difference");
});

test("blends at full strength, whatever the fade says", async ({
  openProjectPage,
  page,
}) => {
  await openDialogWithoutDiff(openProjectPage, page);
  await page.getByTestId("overlayOpacity").getByRole("slider").press("Home");

  await page.getByTestId("differenceToggle").click();

  // faded, a difference blend washes out instead of blacking out what matches,
  // so the fade has no meaning here
  expect(await overlaidOpacity(page)).toBe(1);
  await expect(
    page.getByTestId("overlayOpacity").getByRole("slider"),
  ).toBeDisabled();
});

// the fade belongs to the run being looked at, like the diff switch beside it:
// carrying a half-faded image onto the next screenshot would hide its own diff
test("forgets the fade on the next screenshot", async ({
  openProjectPage,
  page,
}) => {
  await openDialogWithNextUnderReview(openProjectPage, page);
  await page.getByTestId("overlayOpacity").getByRole("slider").press("Home");
  expect(await overlaidOpacity(page)).toBe(0);

  // the slider keeps the focus and would take the arrow itself, as the diff
  // switch does; a reviewer clicks away or uses the arrow button
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press("ArrowRight");

  // back on the diff, and the fade back to opaque, so the next screenshot is
  // shown as it arrived
  await expect(diffSwitch(page)).toBeChecked();
  await expect(
    page.getByTestId("overlayOpacity").getByRole("slider"),
  ).toHaveAttribute("aria-valuenow", "1");
});

test("forgets the blend on the next screenshot", async ({
  openProjectPage,
  page,
}) => {
  await openDialogWithNextUnderReview(openProjectPage, page);
  await page.getByTestId("differenceToggle").click();
  await expect(page.getByTestId("differenceToggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press("ArrowRight");

  await expect(page.getByTestId("differenceToggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

// nothing to see through on either: an ok run matched the baseline it has, and
// a new one has no baseline behind it at all
for (const settled of [TEST_RUN_OK, TEST_RUN_NEW]) {
  test(`hides the fade and the blend on a ${settled.status} screenshot`, async ({
    openProjectPage,
    page,
  }) => {
    const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);

    await projectPage.testRunList.getRow(settled.id).click();
    await expect(page.getByTestId("drawArea").first()).toBeVisible();

    await expect(page.getByTestId("overlayOpacity")).toHaveCount(0);
    await expect(page.getByTestId("differenceToggle")).toHaveCount(0);
  });
}

// an approved run keeps the diff it was approved with, so it keeps the fade
// alongside the diff toggle: what was approved is still worth looking at
test("keeps the fade on an approved screenshot carrying a diff", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);

  await projectPage.testRunList.getRow(TEST_RUN_APPROVED.id).click();
  await expect(page.getByTestId("drawArea").first()).toBeVisible();

  await expect(page.getByTestId("overlayOpacity")).toBeVisible();
  await expect(page.getByTestId("differenceToggle")).toBeVisible();
  await expect(diffSwitch(page)).toBeVisible();
});

test("keeps the fade reachable in a narrow window", async ({
  openProjectPage,
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await openDialog(openProjectPage, page);

  await expect(
    page.getByTestId("overlayOpacity").getByRole("slider"),
  ).toBeVisible();

  await page.getByTestId("overlayOpacity").getByRole("slider").press("Home");

  expect(await overlaidOpacity(page)).toBe(0);
});

test("renders the fade", async ({ openProjectPage, page }) => {
  await openDialog(openProjectPage, page);

  await page.getByTestId("overlayOpacity").getByRole("slider").press("End");
  for (let i = 0; i < 10; i++) {
    await page
      .getByTestId("overlayOpacity")
      .getByRole("slider")
      .press("ArrowLeft");
  }

  await expect(page).toHaveScreenshot("project-page-test-run-overlay.png");
});

test("renders the difference blend", async ({ openProjectPage, page }) => {
  await openDialogWithoutDiff(openProjectPage, page);

  await page.getByTestId("differenceToggle").click();

  await expect(page).toHaveScreenshot("project-page-test-run-difference.png");
});
