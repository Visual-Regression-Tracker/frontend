import { expect, Page } from "@playwright/test";
import { test } from "fixtures";
import { LoginPage, ProjectListPage } from "pages";
import {
  EDITOR_USER,
  GUEST_USER,
  TEST_BUILD_FAILED,
  TEST_BUILD_PASSED,
  TEST_BUILD_UNRESOLVED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
  TEST_RUN_OK,
  TEST_UNRESOLVED,
  TEST_USER,
  TEST_VARIATION_ONE,
  TEST_VARIATION_TWO,
} from "~client/_test/test.data.helper";
import { ImageComparison } from "~client/types/imageComparison";
import type { TestRun } from "~client/types";
import {
  API_URL,
  mockApiError,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetProjects,
  mockGetTestRuns,
  mockGetTestVariationDetails,
  mockGetTestVariations,
  mockGetUsers,
  mockImage,
  mockMatchingVariations,
  mockOllamaModels,
  mockTestRun,
  mockUpdateTestRun,
} from "utils/mocks";

/**
 * The visual contract of the app: every view, in both colour schemes. Each
 * test is named "renders <view>" and writes <view>-<scheme>.png, so
 * `-g renders` updates exactly these baselines.
 */

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;
const SCHEMES = ["light", "dark"] as const;

// only what the wait for the canvases reads off Konva
type KonvaWindow = {
  Konva?: {
    stages: {
      find: (selector: string) => { image: () => HTMLImageElement | null }[];
    }[];
  };
};

// Pictures and fonts are in, and so is every image the dialog's canvases
// draw: those are not <img> elements, so the DOM alone would not tell.
const hasSettled = (page: Page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const stages = (window as unknown as KonvaWindow).Konva?.stages ?? [];
    const canvasImages = stages.flatMap((stage) =>
      stage.find("Image").map((node) => node.image()),
    );

    return [...Array.from(document.images), ...canvasImages].every(
      (image) => !image || image.complete,
    );
  });

const screens = test.extend<{
  shot: (view: string, options?: { fullPage?: boolean }) => Promise<void>;
}>({
  shot: async ({ page, colorScheme }, use) => {
    await use(async (view, options) => {
      // a hover, or a tooltip opened by one, is not part of the view
      await page.mouse.move(0, 0);
      await expect.poll(() => hasSettled(page)).toBe(true);
      await expect(page).toHaveScreenshot(
        `${view}-${colorScheme}.png`,
        options,
      );
    });
  },
});

type Body = Parameters<typeof screens>[2];

// the runs of one screen in two locales, and a screen of its own
const VARIATION_EN: TestRun = {
  ...TEST_UNRESOLVED,
  id: "variation-en",
  name: "Screen A",
  customTags: "en_US",
  diffPercent: 1,
};
const VARIATION_DE: TestRun = {
  ...TEST_UNRESOLVED,
  id: "variation-de",
  name: "Screen A",
  customTags: "de_DE",
  diffPercent: 2,
};
const LONE_SCREEN: TestRun = {
  ...TEST_UNRESOLVED,
  id: "lone",
  name: "Screen B",
  customTags: "en_US",
  diffPercent: 3,
};

// the run under review for bulk approve, its siblings and the one held back
const REVIEWED: TestRun = { ...TEST_UNRESOLVED, customTags: "en" };
const sibling = (customTags: string, diffPercent: number): TestRun => ({
  ...REVIEWED,
  id: `variation_${customTags}`,
  customTags,
  diffPercent,
});
const GERMAN = sibling("de", 3);
const FRENCH = sibling("fr", 2);
const SPANISH = {
  ...sibling("es", 9),
  reason: "The change is not the same",
};

// a run with no areas of its own, so that the one drawn is the only one
const WITHOUT_AREAS: TestRun = {
  ...TEST_UNRESOLVED,
  ignoreAreas: "[]",
  tempIgnoreAreas: "[]",
};

const mockImages = async (page: Page) => {
  for (const image of [
    "baseline.png",
    "diff.png",
    "image.png",
    "baseline1.png",
    "baseline2.png",
  ]) {
    await mockImage(page, image);
  }
};

const VIEWS: [name: string, body: Body][] = [
  [
    "login",
    async ({ loginPage, shot }) => {
      await expect(loginPage.loginBtn).toBeVisible();

      await shot("login");
    },
  ],

  [
    "login with OIDC",
    async ({ page, shot }) => {
      await page.route(`${API_URL}/users/oidc/enabled`, (route) =>
        route.fulfill({ body: "true" }),
      );
      await page.goto("/login");

      await expect(page.getByTestId("oidcLoginBtn")).toBeVisible();
      await expect(new LoginPage(page).loginBtn).toBeHidden();
      await shot("login-oidc");
    },
  ],

  [
    "register",
    async ({ registerPage, shot }) => {
      await expect(registerPage.registerBtn).toBeVisible();

      await shot("register");
    },
  ],

  [
    "project list",
    async ({ projectListPage, shot }) => {
      await expect(projectListPage.projects).toHaveCount(1);

      await shot("project-list");
    },
  ],

  [
    "project list empty",
    async ({ page, authUser, shot }) => {
      void authUser;
      await mockGetProjects(page, []);
      const [response] = await Promise.all([
        page.waitForResponse(`${API_URL}/projects`),
        page.goto("/projects"),
      ]);
      await response.finished();

      await expect(new ProjectListPage(page).addBtn).toBeVisible();
      await expect(page.getByText("0 projects")).toBeVisible();
      await expect(new ProjectListPage(page).projects).toHaveCount(0);
      await shot("project-list-empty");
    },
  ],

  [
    "create project dialog",
    async ({ projectListPage, shot }) => {
      await projectListPage.addBtn.click();

      await expect(projectListPage.dialog).toBeVisible();
      await expect(projectListPage.imageComparison).toHaveText(
        ImageComparison.pixelmatch,
      );
      await expect(projectListPage.threshold).toHaveValue("0.1");
      await shot("create-project");
    },
  ],

  [
    "edit project dialog with VLM and Ollama",
    async ({ projectListPage, shot }) => {
      await projectListPage.editBtn.click();
      await projectListPage.selectImageComparison(ImageComparison.vlm);
      await projectListPage.selectOllamaModel("llava:13b");
      // the focused field keeps its tooltip open over the form: take the focus
      // off it
      await projectListPage.dialog.getByRole("heading").first().click();

      await expect(projectListPage.ollamaModel).toHaveText("llava:13b");
      await expect(projectListPage.page.getByRole("tooltip")).toHaveCount(0);
      await shot("edit-project-vlm-ollama");
    },
  ],

  [
    "delete project confirmation",
    async ({ projectListPage, shot }) => {
      await projectListPage.deleteBtn.click();

      await expect(projectListPage.dialog).toContainText(
        `Are you sure you want to delete: ${project.name}?`,
      );
      await expect(projectListPage.page.getByRole("tooltip")).toHaveCount(0);
      await shot("delete-project");
    },
  ],

  [
    "project page as a table",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);

      await expect(projectPage.testRunList.rows).toHaveCount(4);
      await shot("project-page-table");
    },
  ],

  [
    "project page as a grid",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);
      await projectPage.testRunList.gridViewToggle.click();

      await expect(projectPage.testRunList.cards).toHaveCount(4);
      await shot("project-page-grid");
    },
  ],

  [
    "project page with variations grouped",
    async ({ openProjectPage, page, shot }) => {
      const runs = [VARIATION_EN, VARIATION_DE, LONE_SCREEN];
      await mockGetTestRuns(page, build.id, runs);
      for (const run of runs) {
        await mockTestRun(page, run);
      }
      const projectPage = await openProjectPage(project.id, build.id);
      await projectPage.testRunList.gridViewToggle.click();
      await projectPage.testRunList.groupToggle.click();

      // the three screens, collapsed into two cards
      await expect(projectPage.testRunList.cards).toHaveCount(2);
      await shot("project-page-grouped");
    },
  ],

  [
    "project page with runs selected",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);
      await expect(projectPage.testRunList.rows).toHaveCount(4);

      await projectPage.testRunList.checkRow(TEST_UNRESOLVED.id);
      await projectPage.testRunList.checkRow(TEST_RUN_NEW.id);

      await expect(projectPage.testRunList.approveBtn).toBeVisible();
      await expect(
        projectPage.testRunList
          .getRow(TEST_UNRESOLVED.id)
          .getByRole("checkbox"),
      ).toBeChecked();
      await shot("project-page-selected");
    },
  ],

  [
    "project page with no builds",
    async ({ openProjectPage, page, shot }) => {
      await mockGetBuilds(page, project.id, []);
      const projectPage = await openProjectPage(project.id);

      await expect(projectPage.buildList.emptyMessage).toBeVisible();
      await shot("project-page-no-builds");
    },
  ],

  [
    "test run details",
    async ({ openProjectPage, shot }) => {
      const { details } = await openProjectPage(
        project.id,
        build.id,
        TEST_UNRESOLVED.id,
      );

      await expect(details.step).toBeVisible();
      await expect(details.drawAreas).toHaveCount(2);
      await expect(details.toggleDiff).toBeChecked();
      await shot("test-run-details");
    },
  ],

  [
    "test run details with an ignore area",
    async ({ openProjectPage, page, shot }) => {
      await mockGetTestRuns(page, build.id, [WITHOUT_AREAS, TEST_RUN_NEW]);
      await mockTestRun(page, WITHOUT_AREAS);
      const { details } = await openProjectPage(
        project.id,
        build.id,
        WITHOUT_AREAS.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await details.drawMode.click();
      await expect(details.drawMode).toHaveAttribute("aria-pressed", "true");
      await details.drag({ x: 60, y: 60 }, { x: 260, y: 180 });

      await expect.poll(() => details.ignoreRects()).toHaveLength(1);
      await expect(details.saveAreas).toBeEnabled();
      await shot("test-run-ignore-area");
    },
  ],

  [
    "test run details with comments",
    async ({ openProjectPage, page, shot }) => {
      await mockUpdateTestRun(page, TEST_UNRESOLVED);
      const { details } = await openProjectPage(
        project.id,
        build.id,
        TEST_UNRESOLVED.id,
      );
      await expect(details.step).toBeVisible();

      await details.commentsBtn.click();

      await expect(details.comment).toHaveValue(TEST_UNRESOLVED.comment);
      await shot("test-run-comments");
    },
  ],

  [
    "matching variations dialog",
    async ({ openProjectPage, page, shot }) => {
      await mockGetProjects(page, [
        { ...project, bulkApproveVariations: true },
      ]);
      await mockGetTestRuns(page, build.id, [
        REVIEWED,
        GERMAN,
        FRENCH,
        SPANISH,
      ]);
      await mockTestRun(page, REVIEWED);
      await mockMatchingVariations(
        page,
        REVIEWED.id,
        [GERMAN, FRENCH],
        [SPANISH],
      );
      const { details } = await openProjectPage(
        project.id,
        build.id,
        REVIEWED.id,
      );
      await expect(details.step).toBeVisible();

      await details.approveVariations.click();

      await expect(details.variationsToggleAll).toBeVisible();
      await expect(details.variationThumbnails.first()).toBeVisible();
      await shot("matching-variations");
    },
  ],

  [
    "test variation list",
    async ({ openTestVariationListPage, shot }) => {
      const listPage = await openTestVariationListPage(project.id);

      await expect(listPage.cards.first()).toBeVisible();
      await expect(listPage.getCard(TEST_VARIATION_TWO.name)).toBeVisible();
      await shot("test-variation-list", { fullPage: true });
    },
  ],

  [
    "test variation details",
    async ({ openTestVariationDetailsPage, page, shot }) => {
      await mockGetTestVariationDetails(page, TEST_VARIATION_ONE);
      const detailsPage = await openTestVariationDetailsPage(
        TEST_VARIATION_ONE.id,
      );

      await expect(detailsPage.testRunBtns).toHaveCount(
        TEST_VARIATION_ONE.baselines.length,
      );
      await shot("test-variation-details", { fullPage: true });
    },
  ],

  [
    "profile",
    async ({ profilePage, shot }) => {
      await expect(profilePage.apiKeyCard).toBeVisible();
      await expect(profilePage.configFile).toBeVisible();

      await shot("profile", { fullPage: true });
    },
  ],

  [
    "user list",
    async ({ userListPage, shot }) => {
      await expect(userListPage.table.getRow(TEST_USER.id)).toBeVisible();
      await expect(userListPage.table.getRow(GUEST_USER.id)).toBeVisible();

      await shot("user-list");
    },
  ],

  [
    "avatar menu",
    async ({ projectListPage, shot }) => {
      await expect(projectListPage.projects).toHaveCount(1);

      await projectListPage.header.openAvatarMenu();

      await expect(projectListPage.header.avatarMenu).toBeVisible();
      await shot("avatar-menu");
    },
  ],

  [
    "help menu",
    async ({ projectListPage, shot }) => {
      await expect(projectListPage.projects).toHaveCount(1);

      await projectListPage.header.helpMenuButton.click();

      await expect(projectListPage.header.helpMenu).toBeVisible();
      await shot("help-menu");
    },
  ],

  [
    "guided tour",
    async ({ projectListPage, shot }) => {
      await expect(projectListPage.projects).toHaveCount(1);

      const tour = await projectListPage.header.startTour();

      await expect(tour.joyrideOverlay).toBeVisible();
      await shot("guided-tour");
    },
  ],

  [
    "error toast",
    async ({ page, authUser, shot }) => {
      void authUser;
      await mockApiError(page, `${API_URL}/projects`, 500, "Database is down");
      await page.goto("/projects");
      const projectListPage = new ProjectListPage(page);

      await expect(projectListPage.notification.message).toHaveText(
        "Database is down",
      );
      await expect(projectListPage.addBtn).toBeVisible();
      await shot("error-toast");
    },
  ],
];

for (const scheme of SCHEMES) {
  screens.describe(scheme, () => {
    screens.use({ colorScheme: scheme });

    screens.beforeEach(async ({ page }) => {
      await page.route(`${API_URL}/users/oidc/enabled`, (route) =>
        route.fulfill({ body: "false" }),
      );
      await mockGetProjects(page, [project]);
      await mockGetBuilds(page, project.id, [
        TEST_BUILD_FAILED,
        TEST_BUILD_PASSED,
        TEST_BUILD_UNRESOLVED,
      ]);
      await mockGetBuildDetails(page, build);
      await mockGetTestRuns(page, build.id, [
        TEST_UNRESOLVED,
        TEST_RUN_APPROVED,
        TEST_RUN_NEW,
        TEST_RUN_OK,
      ]);
      for (const run of [
        TEST_UNRESOLVED,
        TEST_RUN_APPROVED,
        TEST_RUN_NEW,
        TEST_RUN_OK,
      ]) {
        await mockTestRun(page, run);
      }
      await mockGetTestVariations(page, project.id, [
        TEST_VARIATION_ONE,
        TEST_VARIATION_TWO,
      ]);
      await mockGetUsers(page, [TEST_USER, EDITOR_USER, GUEST_USER]);
      await mockOllamaModels(page, ["gemma3:12b", "llava:13b"]);
      await mockImages(page);
    });

    for (const [name, body] of VIEWS) {
      screens(`renders ${name}`, body);
    }
  });
}
