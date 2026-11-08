import { expect, Page } from "@playwright/test";
import { OpenProjectPage, test } from "fixtures";
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
import type { Build } from "~client/types";
import { boxOf } from "utils/boxOf";

type KonvaStage = {
  findOne: (
    selector: string,
  ) =>
    | { opacity: () => number; globalCompositeOperation: () => string }
    | undefined;
};

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
  // the dialog is a lazy chunk: wait for it like screens.spec does
  await expect(projectPage.details.step).toBeVisible();
  await expect(projectPage.details.drawAreas).toHaveCount(2);
  await expect(projectPage.details.diffMode).toHaveAttribute(
    "aria-pressed",
    "true",
  );

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

  await expect(projectPage.buildList.selectionBar).toContainText("15 selected");

  await projectPage.buildList.deleteSelectedBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "15 builds deleted",
  );
});

test("shows a build's checkbox on hover, and on every build once one is ticked", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id);
  const first = projectPage.buildList.getBuildItem(TEST_BUILD_FAILED.number);
  const second = projectPage.buildList.getBuildItem(TEST_BUILD_PASSED.number);
  const boxOfBuild = (build: typeof first) =>
    build.locator(".MuiCheckbox-root");
  await expect(first).toBeVisible();

  await expect(boxOfBuild(first)).toHaveCSS("opacity", "0");
  await first.hover();
  await expect(boxOfBuild(first)).toHaveCSS("opacity", "1");

  await first.getByRole("checkbox").check();
  await page.mouse.move(0, 0);

  await expect(boxOfBuild(second)).toHaveCSS("opacity", "1");
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

const manyBuilds = Array.from({ length: 35 }, (_, i) => ({
  ...TEST_BUILD_PASSED,
  id: `build-${i}`,
  number: 100 + i,
}));

const openLinkedTo = async (
  openProjectPage: OpenProjectPage,
  page: Page,
  build: Build,
) => {
  await mockGetBuilds(page, project.id, manyBuilds);
  await mockGetBuildDetails(page, build);
  await mockGetTestRuns(page, build.id, []);
  return openProjectPage(project.id, build.id);
};

test("opens the list on the page the linked build is on", async ({
  openProjectPage,
  page,
}) => {
  const linked = manyBuilds[32];

  const projectPage = await openLinkedTo(openProjectPage, page, linked);

  await expect(
    projectPage.buildList.getBuildLocator(linked.number),
  ).toBeVisible();
  await expect(projectPage.buildList.currentPage).toHaveText("4");
});

test("stays on the first page for a link to a build it cannot place", async ({
  openProjectPage,
  page,
}) => {
  const stranger = { ...TEST_BUILD_PASSED, id: "gone", number: 999 };

  const projectPage = await openLinkedTo(openProjectPage, page, stranger);

  await expect(projectPage.buildList.getBuildLocator(100)).toBeVisible();
  await expect(projectPage.buildList.currentPage).toHaveText("1");
});

test("leaves the page the reviewer picked alone", async ({
  openProjectPage,
  page,
}) => {
  const linked = manyBuilds[32];
  const projectPage = await openLinkedTo(openProjectPage, page, linked);
  await expect(projectPage.buildList.currentPage).toHaveText("4");

  await projectPage.buildList.goToPage(1);

  await expect(projectPage.buildList.currentPage).toHaveText("1");
  await expect(projectPage.buildList.getBuildLocator(100)).toBeVisible();
});

test("keeps wheel zoom inside the image pane", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();

  // a wheel off the artwork must still be handled, or the browser zooms the page
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
  const bounds = await boxOf(pane);

  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 20);
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 120);
  }

  const shrunk = await boxOf(canvas);
  expect(shrunk.x + shrunk.width).toBeLessThan(bounds.x + bounds.width - 20);

  await page.mouse.move(bounds.x + bounds.width - 10, bounds.y + 20);
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, -120);
  }

  const grown = await boxOf(canvas);
  expect(grown.width).toBeGreaterThan(shrunk.width);
});

test("zooms towards the cursor", async ({ openProjectPage, page }) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();

  const pane = page.getByTestId("drawArea").first();
  await expect(pane).toBeVisible();

  // only the horizontal axis: the pane grows in height instead of scrolling
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
  const zoomOut = page.getByRole("button", { name: "Zoom out" });

  for (let i = 0; i < 60; i++) {
    await zoomOut.click();
  }

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
    const canvas = el.querySelector<HTMLCanvasElement>("canvas");
    if (!canvas) throw new Error("No canvas in the pane");
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

test("can download images", async ({ openProjectPage }) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);

  await projectPage.testRunList.checkRow(TEST_UNRESOLVED.id);
  await projectPage.testRunList.checkRow(TEST_RUN_NEW.id);

  await projectPage.testRunList.downloadBtn.click();
  await projectPage.modal.confirmBtn.click();

  await expect(projectPage.notification.message).toHaveText(
    "2 test runs processed.",
  );
});

test("switches to another project by typing its name", async ({
  openProjectPage,
  page,
}) => {
  const other = { ...project, id: "other-project-id", name: "Other project" };
  await mockGetProjects(page, [project, other]);
  await mockGetBuilds(page, other.id, []);
  const projectPage = await openProjectPage(project.id);
  await expect(projectPage.header.projectCrumb).toHaveText(project.name);

  await projectPage.header.switchProject("other", "Other project");

  await expect(page).toHaveURL(new RegExp(`/${other.id}$`));
  await expect(projectPage.header.projectCrumb).toHaveText("Other project");
});

test("shows Projects and the project in the breadcrumb, with the project tabs", async ({
  openProjectPage,
}) => {
  const projectPage = await openProjectPage(project.id);

  await expect(
    projectPage.header.breadcrumb.getByRole("link", { name: "Projects" }),
  ).toHaveAttribute("href", "/projects");
  await expect(projectPage.header.projectCrumb).toHaveText(project.name);
  await expect(projectPage.header.tabs.getByRole("tab")).toHaveText([
    "Builds",
    "Variations",
    "Statistics",
    "Settings",
  ]);
  await expect(projectPage.header.tab("Builds")).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

const openDialogWithoutDiff = async (
  openProjectPage: OpenProjectPage,
  page: Page,
) => {
  const noDiff = { ...TEST_UNRESOLVED, diffName: null };
  await mockGetTestRuns(page, TEST_BUILD_FAILED.id, [noDiff]);
  await mockTestRun(page, noDiff);
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(noDiff.id).click();
  await expect(page.getByTestId("drawArea")).toHaveCount(2);

  return projectPage;
};

const openDialogWithNextUnderReview = async (
  openProjectPage: OpenProjectPage,
  page: Page,
) => {
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

const openDialog = async (openProjectPage: OpenProjectPage, page: Page) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);
  await projectPage.testRunList.getRow(TEST_UNRESOLVED.id).click();
  // both panes, or a count asserted later proves nothing
  await expect(page.getByTestId("drawArea")).toHaveCount(2);

  return projectPage;
};

const overlaidOpacity = (page: Page) =>
  page
    .getByTestId("drawArea")
    .first()
    .evaluate(() => {
      const { Konva } = window as unknown as {
        Konva: { stages: KonvaStage[] };
      };

      const overlaid = Konva.stages
        .map((stage) => stage.findOne(".overlaid"))
        .find(Boolean);
      if (!overlaid) throw new Error("No overlaid image on any stage");

      return overlaid.opacity();
    });

const modeButton = (page: Page, name: string) =>
  page
    .getByRole("group", { name: "View mode" })
    .getByRole("button", { name, exact: true });

const openFade = (page: Page) => modeButton(page, "Fade").click();

test("keeps both panes and fades the image over the baseline", async ({
  openProjectPage,
  page,
}) => {
  await openDialog(openProjectPage, page);
  await openFade(page);
  await expect(page.getByTestId("overlayOpacity")).toBeVisible();

  await page.getByTestId("overlayOpacity").getByRole("slider").press("Home");

  await expect(page.getByTestId("drawArea")).toHaveCount(2);
  expect(await overlaidOpacity(page)).toBe(0);
});

test("takes the pane off the diff when Fade is chosen", async ({
  openProjectPage,
  page,
}) => {
  await openDialog(openProjectPage, page);
  await expect(modeButton(page, "Diff")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("overlayOpacity")).toHaveCount(0);

  await openFade(page);

  await expect(modeButton(page, "Diff")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(modeButton(page, "Fade")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await overlaidOpacity(page)).toBe(0.5);
});

test("blends the two as a difference, diff image or not", async ({
  openProjectPage,
  page,
}) => {
  await openDialogWithoutDiff(openProjectPage, page);
  await openFade(page);

  await page.getByTestId("differenceToggle").click();

  expect(
    await page
      .getByTestId("drawArea")
      .first()
      .evaluate(() => {
        const { Konva } = window as unknown as {
          Konva: { stages: KonvaStage[] };
        };

        const overlaid = Konva.stages
          .map((stage) => stage.findOne(".overlaid"))
          .find(Boolean);
        if (!overlaid) throw new Error("No overlaid image on any stage");

        return overlaid.globalCompositeOperation();
      }),
  ).toBe("difference");
});

test("blends at full strength, whatever the fade says", async ({
  openProjectPage,
  page,
}) => {
  await openDialogWithoutDiff(openProjectPage, page);
  await openFade(page);
  await page.getByTestId("overlayOpacity").getByRole("slider").press("Home");

  await page.getByTestId("differenceToggle").click();

  // a difference blend washes out when faded, so the fade is off here
  expect(await overlaidOpacity(page)).toBe(1);
  await expect(
    page.getByTestId("overlayOpacity").getByRole("slider"),
  ).toBeDisabled();
});

test("forgets the fade on the next screenshot", async ({
  openProjectPage,
  page,
}) => {
  await openDialogWithNextUnderReview(openProjectPage, page);
  await openFade(page);
  await page.getByTestId("overlayOpacity").getByRole("slider").press("Home");
  expect(await overlaidOpacity(page)).toBe(0);

  // the slider keeps focus and would take the arrow itself
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press("ArrowRight");

  await expect(modeButton(page, "Diff")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await openFade(page);
  await expect(
    page.getByTestId("overlayOpacity").getByRole("slider"),
  ).toHaveAttribute("aria-valuenow", "0.5");
});

test("forgets the blend on the next screenshot", async ({
  openProjectPage,
  page,
}) => {
  await openDialogWithNextUnderReview(openProjectPage, page);
  await openFade(page);
  await page.getByTestId("differenceToggle").click();
  await expect(page.getByTestId("differenceToggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press("ArrowRight");

  await expect(modeButton(page, "Diff")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await openFade(page);
  await expect(page.getByTestId("differenceToggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

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
    await expect(modeButton(page, "Fade")).toHaveCount(0);
  });
}

test("keeps the fade on an approved screenshot carrying a diff", async ({
  openProjectPage,
  page,
}) => {
  const projectPage = await openProjectPage(project.id, TEST_BUILD_FAILED.id);

  await projectPage.testRunList.getRow(TEST_RUN_APPROVED.id).click();
  await expect(page.getByTestId("drawArea").first()).toBeVisible();

  await expect(modeButton(page, "Diff")).toBeVisible();
  await openFade(page);
  await expect(page.getByTestId("overlayOpacity")).toBeVisible();
  await expect(page.getByTestId("differenceToggle")).toBeVisible();
});

test("keeps the fade reachable in a narrow window", async ({
  openProjectPage,
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await openDialog(openProjectPage, page);
  await openFade(page);

  await expect(
    page.getByTestId("overlayOpacity").getByRole("slider"),
  ).toBeVisible();

  await page.getByTestId("overlayOpacity").getByRole("slider").press("Home");

  expect(await overlaidOpacity(page)).toBe(0);
});

test("renders the fade", async ({ openProjectPage, page }) => {
  await openDialog(openProjectPage, page);
  await openFade(page);

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
  await openFade(page);

  await page.getByTestId("differenceToggle").click();
  await page.mouse.move(0, 0);

  await expect(page).toHaveScreenshot("project-page-test-run-difference.png");
});
