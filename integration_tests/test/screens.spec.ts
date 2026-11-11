import { expect, Page } from "@playwright/test";
import { test as base } from "fixtures";
import {
  AddProjectPage,
  LoginPage,
  ProjectListPage,
  ProjectStatisticsPage,
} from "pages";
import { ProjectPage } from "pages/ProjectPage";
import { RegisterPage } from "pages/RegisterPage";
import type { BasePage } from "pages/BasePage";
import type { ProjectSettingsPage } from "pages/ProjectSettingsPage";
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
import { type TestRun, TestStatus } from "~client/types";
import {
  API_URL,
  isRevertUrl,
  mockApiError,
  mockApproveTestRuns,
  mockGetBuildDetails,
  mockGetBuilds,
  mockGetFavoriteProjects,
  mockGetProjects,
  mockGetStatisticsResults,
  mockGetTestRuns,
  mockGetTestVariationDetails,
  mockGetTestVariations,
  mockGetUsers,
  mockImage,
  mockMatchingVariations,
  mockDinov2Status,
  mockOllamaModels,
  mockRegistrationEnabled,
  mockTestRun,
  mockTestRunsWithDetails,
  mockUpdateTestRun,
} from "utils/mocks";
import { GO_TO_NEXT_KEY } from "~client/constants";
import { defined } from "utils/defined";
import { STATISTICS_BUILDS } from "utils/statistics";
import {
  ANALYSED_RUNS,
  NOISE_SETTINGS,
  NOISE_CART,
  PENDING_SEARCH,
  PROJECT_WITHOUT_NOISE,
} from "utils/noiseRuns";

// "renders <view>" tests write <view>-<scheme>.png: `-g renders` updates the baselines

const project = TEST_PROJECT;
const build = TEST_BUILD_FAILED;
const SCHEMES = ["light", "dark"] as const;

const LISTED_PROJECTS = [
  project,
  {
    ...project,
    id: "checkout-id",
    name: "Checkout flow",
    mainBranchName: "main",
  },
  {
    ...project,
    id: "mobile-id",
    name: "Mobile web",
    mainBranchName: "develop",
  },
  { ...project, id: "storybook-id", name: "Storybook", mainBranchName: "main" },
];
const FAVORITE_ID = "storybook-id";

type KonvaWindow = {
  Konva?: {
    stages: {
      find: (selector: string) => { image: () => HTMLImageElement | null }[];
    }[];
  };
};

// the dialog's canvases draw Konva images, not <img>: the DOM alone would not tell
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

const test = base.extend<{
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

type Body = Parameters<typeof test>[2];

// the page scrolls inside <main>, which the clicks on the selects leave wherever they scrolled to
const showTopOfSettings = async (settings: ProjectSettingsPage) => {
  await settings.scrollMainToTop();
  await expect.poll(() => settings.mainScrollTop()).toBe(0);
  await expect(settings.saveBtn).toBeVisible();
};

const showWholeContent = async (content: BasePage) => {
  await expect
    .poll(async () => {
      const extra = await content.mainOverflow();
      if (extra > 0) await content.growViewportBy(extra);
      return extra;
    })
    .toBe(0);
  await content.scrollMainToTop();
};

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

const WITHOUT_AREAS: TestRun = {
  ...TEST_UNRESOLVED,
  ignoreAreas: "[]",
  tempIgnoreAreas: "[]",
};

const ALL_ANALYSED_RUNS = [
  ...ANALYSED_RUNS,
  NOISE_SETTINGS,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
];

const PARTLY_ANALYSED_RUNS = [
  ...ANALYSED_RUNS,
  PENDING_SEARCH,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
];

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

      const loginPage = new LoginPage(page);
      await expect(loginPage.ssoBtn).toBeVisible();
      await expect(loginPage.loginBtn).toBeHidden();
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
    "register when registration is turned off",
    async ({ page, shot }) => {
      await mockRegistrationEnabled(page, false);
      await page.goto("/register");

      await expect(new RegisterPage(page).disabledNotice).toBeVisible();
      await shot("register-off");
    },
  ],

  [
    "project list while it loads",
    async ({ page, authUser, shot }) => {
      void authUser;
      // never answered, so the page stays in its loading state
      await page.route(`${API_URL}/projects`, () => undefined);
      await page.goto("/projects");

      await expect(new ProjectListPage(page).loadingStatus).toBeVisible();
      await shot("project-list-loading");
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
      await expect(new ProjectListPage(page).text("0 projects")).toBeVisible();
      await expect(new ProjectListPage(page).projects).toHaveCount(0);
      await shot("project-list-empty");
    },
  ],

  [
    "project list with favourites",
    async ({ page, authUser, shot }) => {
      void authUser;
      await mockGetProjects(page, LISTED_PROJECTS);
      await mockGetFavoriteProjects(page, [FAVORITE_ID]);
      await page.goto("/projects");
      const projectListPage = new ProjectListPage(page);

      await expect(projectListPage.projects).toHaveCount(4);
      await expect(projectListPage.section("Favourites")).toBeVisible();
      await expect(projectListPage.section("Other projects")).toBeVisible();
      await shot("project-list-favourites", { fullPage: true });
    },
  ],

  [
    "project list search without a match",
    async ({ page, authUser, shot }) => {
      void authUser;
      await mockGetProjects(page, LISTED_PROJECTS);
      await page.goto("/projects?q=billing");

      await expect(
        new ProjectListPage(page).text("No projects match “billing”"),
      ).toBeVisible();
      await shot("project-list-no-match");
    },
  ],

  [
    "project settings with VLM and Ollama",
    async ({ projectSettingsPage, shot }) => {
      await projectSettingsPage.selectImageComparison(ImageComparison.vlm);
      await projectSettingsPage.selectOllamaModel("llava:13b");

      await expect(projectSettingsPage.ollamaModel).toHaveText("llava:13b");
      await expect(projectSettingsPage.listbox).toHaveCount(0);
      await expect(projectSettingsPage.tooltip).toHaveCount(0);
      await showTopOfSettings(projectSettingsPage);
      await showWholeContent(projectSettingsPage);
      await shot("project-settings-vlm-ollama", { fullPage: true });
    },
  ],

  [
    "project settings with post-analysis on a server without DINOv2",
    async ({ projectSettingsPage, page, shot }) => {
      await mockDinov2Status(page, {
        configured: false,
        available: false,
      });
      await projectSettingsPage.reload();
      await projectSettingsPage.dinov2Status.scrollIntoViewIfNeeded();

      await expect(projectSettingsPage.dinov2Status).toBeVisible();
      await expect(projectSettingsPage.tooltip).toHaveCount(0);
      await showWholeContent(projectSettingsPage);
      await shot("project-settings-post-analysis-no-dinov2", {
        fullPage: true,
      });
    },
  ],

  [
    "delete project confirmation",
    async ({ projectListPage, shot }) => {
      await projectListPage.deleteBtn.click();

      await expect(projectListPage.modal.dialog).toContainText(
        `Are you sure you want to delete: ${project.name}?`,
      );
      await expect(projectListPage.tooltip).toHaveCount(0);
      await shot("delete-project");
    },
  ],

  [
    "project switcher open",
    async ({ openProjectPage, page, shot }) => {
      await mockGetProjects(page, LISTED_PROJECTS);
      await mockGetFavoriteProjects(page, [FAVORITE_ID]);
      const projectPage = await openProjectPage(project.id, build.id);
      await expect(projectPage.testRunList.rows).toHaveCount(4);

      await projectPage.header.projectCrumb.click();

      await expect(projectPage.menuItems).toHaveCount(4);
      await shot("project-switcher");
    },
  ],

  [
    "project page without the noise check",
    async ({ openProjectPage, page, shot }) => {
      await mockGetProjects(page, [PROJECT_WITHOUT_NOISE]);
      const projectPage = await openProjectPage(project.id, build.id);

      await expect(projectPage.testRunList.rows).toHaveCount(4);
      await expect(projectPage.testRunList.noiseColumnHeader).toHaveCount(0);
      await shot("project-page-without-noise");
    },
  ],

  [
    "project page table with an auto-approved run",
    async ({ openProjectPage, page, shot }) => {
      await mockGetTestRuns(page, build.id, [
        TEST_RUN_NEW,
        {
          ...TEST_RUN_APPROVED,
          id: "auto-approved",
          status: TestStatus.autoApproved,
        },
        TEST_RUN_OK,
      ]);
      const projectPage = await openProjectPage(project.id, build.id);

      await expect(projectPage.testRunList.rows).toHaveCount(3);
      await shot("project-page-table-auto-approved");
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
    "project page with noise hints",
    async ({ openProjectPage, page, shot }) => {
      await mockTestRunsWithDetails(page, build.id, ALL_ANALYSED_RUNS);
      const projectPage = await openProjectPage(project.id, build.id);

      await expect(projectPage.testRunList.noiseChips).toHaveCount(5);
      await expect(projectPage.buildDetails.menuButton).toBeVisible();
      await shot("project-page-noise-hints");
    },
  ],

  [
    "project page with a run being analysed",
    async ({ openProjectPage, page, shot }) => {
      await mockTestRunsWithDetails(page, build.id, PARTLY_ANALYSED_RUNS);
      const projectPage = await openProjectPage(project.id, build.id);
      await expect(projectPage.testRunList.noiseChips).toHaveCount(5);
      await expect(
        projectPage.testRunList.noiseChip(PENDING_SEARCH.id),
      ).toHaveText("Analysing…");
      await expect(projectPage.buildDetails.noiseLine).toHaveText(
        "Analysing 1 of 5…",
      );
      await shot("project-page-noise-analysing");
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
    "project page with runs selected",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);
      await expect(projectPage.testRunList.rows).toHaveCount(4);

      await projectPage.testRunList.checkRow(TEST_UNRESOLVED.id);
      await projectPage.testRunList.checkRow(TEST_RUN_NEW.id);

      await expect(projectPage.testRunList.approveBtn).toBeVisible();
      await expect(
        projectPage.testRunList.rowCheckbox(TEST_UNRESOLVED.id),
      ).toBeChecked();
      await shot("project-page-selected");
    },
  ],

  [
    "project page after a bulk approval, with undo",
    async ({ openProjectPage, page, shot }) => {
      await mockApproveTestRuns(page);
      const projectPage = await openProjectPage(project.id, build.id);
      await expect(projectPage.testRunList.rows).toHaveCount(4);
      await projectPage.testRunList.checkRow(TEST_UNRESOLVED.id);
      await projectPage.testRunList.checkRow(TEST_RUN_NEW.id);

      await projectPage.testRunList.approveBtn.click();
      await projectPage.modal.confirmBtn.click();

      await expect(
        projectPage.notification.undoBtn("2 test runs approved."),
      ).toBeVisible();
      await shot("project-page-bulk-approved-undo");
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
      await expect(details.diffMode).toHaveAttribute("aria-pressed", "true");
      await shot("test-run-details");
    },
  ],

  [
    "test run details with a noise hint",
    async ({ openProjectPage, page, shot }) => {
      await mockGetTestRuns(page, build.id, [NOISE_CART, TEST_RUN_NEW]);
      await mockTestRun(page, NOISE_CART);
      const { details } = await openProjectPage(
        project.id,
        build.id,
        NOISE_CART.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await details.noiseChip.click();

      await expect(details.noisePanel).toContainText(
        "Rendering-noise check: likely noise",
      );
      await shot("test-run-noise-hint");
    },
  ],

  [
    "test run details after someone else approved it first",
    async ({ openProjectPage, page, shot }) => {
      const shown = "This test run is already approved";
      await mockApproveTestRuns(page, {
        succeeded: [],
        failed: [
          {
            id: TEST_UNRESOLVED.id,
            message: `Test run ${TEST_UNRESOLVED.id} is already approved`,
          },
        ],
      });
      const projectPage = await openProjectPage(
        project.id,
        build.id,
        TEST_UNRESOLVED.id,
      );
      await expect(projectPage.details.step).toBeVisible();

      await projectPage.details.approve.click();

      await expect(projectPage.notification.toast(shown)).toBeVisible();
      await shot("test-run-already-approved");
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

      await details.editAreas.click();
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

      await expect(details.comment).toHaveValue(
        defined(TEST_UNRESOLVED.comment, "The run's comment"),
      );
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
    "test variation list filtered",
    async ({ openTestVariationListPage, page, shot }) => {
      await mockGetTestVariations(page, project.id, [
        TEST_VARIATION_ONE,
        { ...TEST_VARIATION_TWO, branchName: "develop" },
      ]);
      const listPage = await openTestVariationListPage(project.id);

      await listPage.filterBy("branchName", "develop");

      await expect(listPage.cards).toHaveCount(1);
      await expect(listPage.clearFilters).toBeVisible();
      await shot("test-variation-list-filtered");
    },
  ],

  [
    "test variation list empty",
    async ({ openTestVariationListPage, page, shot }) => {
      await mockGetTestVariations(page, project.id, []);
      const listPage = await openTestVariationListPage(project.id);

      await expect(listPage.text("No variations")).toBeVisible();
      await expect(listPage.cards).toHaveCount(0);
      await shot("test-variation-list-empty");
    },
  ],

  [
    "profile",
    async ({ profilePage, shot }) => {
      await expect(profilePage.apiKeyCard).toBeVisible();
      await expect(profilePage.role).toBeVisible();
      await expect(profilePage.configFile).toBeVisible();

      await showWholeContent(profilePage);
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
    "project settings",
    async ({ projectSettingsPage, shot }) => {
      await expect(projectSettingsPage.name).toHaveValue(project.name);
      await expect(projectSettingsPage.saveBtn).toBeVisible();

      await showWholeContent(projectSettingsPage);
      await shot("project-settings", { fullPage: true });
    },
  ],

  [
    "project statistics",
    async ({ page, authUser, shot }) => {
      void authUser;
      await mockGetStatisticsResults(page, project.id, STATISTICS_BUILDS);
      await page.goto(`/statistics/${project.id}`);

      await expect(new ProjectStatisticsPage(page).bar(/Build #/)).toHaveCount(
        12,
      );
      await shot("project-statistics");
    },
  ],

  [
    "project statistics with few builds",
    async ({ page, authUser, shot }) => {
      void authUser;
      await mockGetStatisticsResults(
        page,
        project.id,
        STATISTICS_BUILDS.slice(0, 2),
      );
      await page.goto(`/statistics/${project.id}`);

      await expect(
        new ProjectStatisticsPage(page).text("Only a few builds so far"),
      ).toBeVisible();
      await shot("project-statistics-few");
    },
  ],

  [
    "project statistics without builds",
    async ({ page, authUser, shot }) => {
      void authUser;
      await mockGetStatisticsResults(page, project.id, []);
      await page.goto(`/statistics/${project.id}`);

      await expect(
        new ProjectStatisticsPage(page).text("No builds yet"),
      ).toBeVisible();
      await shot("project-statistics-empty");
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

  [
    "test run details with a VLM analysis and differing image sizes",
    async ({ openProjectPage, page, shot }) => {
      const described = {
        ...TEST_UNRESOLVED,
        id: "vlm-run",
        name: "Cart",
        noiseAnalysis: null,
        vlmDescription:
          "The cart badge moved 4px left; prices are unchanged.\nThe checkout button is a shade darker.",
      };
      await mockGetTestRuns(page, build.id, [described, TEST_RUN_NEW]);
      await mockTestRun(page, described);
      await mockImage(page, "image.png", "narrow.png");
      const { details } = await openProjectPage(
        project.id,
        build.id,
        described.id,
      );
      await expect(details.drawAreas).toHaveCount(2);
      await expect(details.vlmAnalysis).toContainText("The cart badge moved");

      await details.vlmMore.click();

      await expect(details.vlmAnalysis).toContainText("a shade darker");
      await expect(details.text(/Image sizes differ/)).toBeVisible();
      await shot("test-run-vlm-and-size-mismatch");
    },
  ],

  [
    "project settings with looksSame",
    async ({ projectSettingsPage, shot }) => {
      await projectSettingsPage.selectImageComparison(ImageComparison.lookSame);

      await expect(projectSettingsPage.tolerance).toBeVisible();
      await showTopOfSettings(projectSettingsPage);
      await showWholeContent(projectSettingsPage);
      await shot("project-settings-looks-same", { fullPage: true });
    },
  ],

  [
    "user list with selection",
    async ({ userListPage, shot }) => {
      await userListPage.table.checkRow(GUEST_USER.id);
      await userListPage.table.checkRow(EDITOR_USER.id);
      await expect(userListPage.selectionBar).toBeVisible();

      await shot("user-list-selection");
    },
  ],

  [
    "project page with builds selected",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);

      await projectPage.buildList.selectAll.click();

      await expect(projectPage.buildList.selectionBar).toContainText(
        "3 selected",
      );
      await shot("project-page-builds-selected");
    },
  ],

  [
    "test run details with a run that was not analysed",
    async ({ openProjectPage, page, shot }) => {
      const fresh = {
        ...TEST_UNRESOLVED,
        id: "fresh-run",
        noiseAnalysis: null,
      };
      await mockGetTestRuns(page, build.id, [TEST_RUN_NEW, fresh]);
      await mockTestRun(page, fresh);
      const { details } = await openProjectPage(project.id, build.id, fresh.id);
      await expect(details.drawAreas).toHaveCount(2);

      await details.noiseChip.click();

      await expect(details.analyseRun).toBeVisible();
      await shot("test-run-noise-not-analysed");
    },
  ],

  [
    "project settings with VLM and Gemini",
    async ({ projectSettingsPage, shot }) => {
      await projectSettingsPage.selectImageComparison(ImageComparison.vlm);
      await projectSettingsPage.selectVlmProvider("Google Gemini");

      await expect(projectSettingsPage.geminiModel).toBeVisible();
      await showTopOfSettings(projectSettingsPage);
      await showWholeContent(projectSettingsPage);
      await shot("project-settings-vlm-gemini", { fullPage: true });
    },
  ],

  [
    "project page with the build menu open",
    async ({ openProjectPage, shot }) => {
      const { buildDetails } = await openProjectPage(project.id, build.id);

      await buildDetails.openMenu();

      await expect(buildDetails.menu).toBeVisible();
      await shot("project-page-build-menu");
    },
  ],

  [
    "project page with the build list failing",
    async ({ openProjectPage, page, shot }) => {
      await mockApiError(
        page,
        (url) => url.pathname === "/builds",
        500,
        "Builds are down",
      );
      const projectPage = await openProjectPage(project.id);

      await expect(projectPage.buildList.errorMessage).toBeVisible();
      await shot("project-page-builds-failed");
    },
  ],

  [
    "project page with a filter chip open",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);
      await expect(projectPage.testRunList.rows).toHaveCount(4);

      await projectPage.testRunFilters.chip("browser").click();

      await expect(projectPage.testRunFilters.chipOptions).toHaveCount(1);
      await shot("project-page-filter-chip-open");
    },
  ],

  [
    "project page with a tag filter picked",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);
      await expect(projectPage.testRunList.rows).toHaveCount(4);

      await projectPage.testRunFilters.pick("os", "OS");

      await expect(projectPage.testRunFilters.clearFilters).toBeVisible();
      await shot("project-page-tag-filter");
    },
  ],

  [
    "profile asking before regenerating the API key",
    async ({ profilePage, shot }) => {
      await profilePage.regenerateBtn.click();

      await expect(profilePage.modal.dialog).toBeVisible();
      await shot("profile-regenerate-api-key");
    },
  ],

  [
    "test run details in the fade view",
    async ({ openProjectPage, shot }) => {
      const { details } = await openProjectPage(
        project.id,
        build.id,
        TEST_UNRESOLVED.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await details.fadeMode.click();

      await expect(details.fadeSlider).toBeVisible();
      await shot("test-run-fade");
    },
  ],

  [
    "test run details side by side",
    async ({ openProjectPage, shot }) => {
      const { details } = await openProjectPage(
        project.id,
        build.id,
        TEST_UNRESOLVED.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await details.sideBySide.click();

      await expect(details.sideBySide).toHaveAttribute("aria-pressed", "true");
      await shot("test-run-side-by-side");
    },
  ],

  [
    "test run details editing the areas",
    async ({ openProjectPage, page, shot }) => {
      await mockGetTestRuns(page, build.id, [WITHOUT_AREAS, TEST_RUN_NEW]);
      await mockTestRun(page, WITHOUT_AREAS);
      const { details } = await openProjectPage(
        project.id,
        build.id,
        WITHOUT_AREAS.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await details.editAreas.click();

      await expect(details.saveAreas).toBeDisabled();
      await shot("test-run-edit-areas");
    },
  ],

  [
    "test run details of an approved run with the undo",
    async ({ openProjectPage, page, shot }) => {
      const approved = { ...TEST_RUN_APPROVED, baselineName: "baseline.png" };
      await mockGetTestRuns(page, build.id, [approved, TEST_RUN_NEW]);
      await mockTestRun(page, approved);
      const { details } = await openProjectPage(
        project.id,
        build.id,
        approved.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await expect(details.undoApproval).toBeVisible();
      await shot("test-run-undo-approval");
    },
  ],

  [
    "test run details of a rejected run with the undo",
    async ({ openProjectPage, page, shot }) => {
      const rejected = {
        ...TEST_RUN_APPROVED,
        baselineName: "baseline.png",
        status: TestStatus.failed,
      };
      await mockGetTestRuns(page, build.id, [rejected, TEST_RUN_NEW]);
      await mockTestRun(page, rejected);
      const { details } = await openProjectPage(
        project.id,
        build.id,
        rejected.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await expect(details.undoRejection).toBeVisible();
      await shot("test-run-undo-rejection");
    },
  ],

  [
    "project page with no builds matching the search",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id);

      await projectPage.buildList.searchInput.fill("4999");

      await expect(projectPage.buildList.emptyMessage).toBeVisible();
      await shot("project-page-no-builds-match");
    },
  ],

  [
    "project page with no test runs matching the filters",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);
      await expect(projectPage.testRunList.rows).toHaveCount(4);

      await projectPage.testRunFilters.name.fill("no such screen");

      await expect(projectPage.testRunList.rows).toHaveCount(0);
      await shot("project-page-no-runs-match");
    },
  ],

  [
    "test run details after Go to the next, with the undo in the toast",
    async ({ openProjectPage, page, shot }) => {
      await page.addInitScript(
        (key) => localStorage.setItem(key, "true"),
        GO_TO_NEXT_KEY,
      );
      await mockApproveTestRuns(page);
      const runs = [
        TEST_UNRESOLVED,
        TEST_RUN_APPROVED,
        TEST_RUN_NEW,
        TEST_RUN_OK,
      ].map((run) => ({ ...run, baselineName: "baseline.png" }));
      await mockGetTestRuns(page, build.id, runs);
      for (const run of runs) {
        await mockTestRun(page, run);
      }
      const { details, notification } = await openProjectPage(
        project.id,
        build.id,
        TEST_UNRESOLVED.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await details.approve.click();

      await expect(notification.undoBtn("Approved")).toBeVisible();
      await shot("test-run-go-to-next-undo-toast");
    },
  ],

  [
    "test run details when the undo is refused",
    async ({ openProjectPage, page, shot }) => {
      const decided = {
        ...TEST_RUN_APPROVED,
        baselineName: "baseline.png",
      };
      await mockGetTestRuns(page, build.id, [decided, TEST_RUN_NEW]);
      await mockTestRun(page, decided);
      await mockApiError(
        page,
        isRevertUrl,
        409,
        `Test run ${decided.id}: a later approval changed this baseline`,
      );
      const { details, notification } = await openProjectPage(
        project.id,
        build.id,
        decided.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await details.undoApproval.click();

      await expect(
        notification.toast("A later approval changed this baseline"),
      ).toBeVisible();
      await shot("test-run-undo-refused");
    },
  ],

  [
    "test run details when the baseline image fails to load",
    async ({ openProjectPage, page, shot }) => {
      const run = { ...TEST_UNRESOLVED, baselineName: "missing-baseline.png" };
      await mockGetTestRuns(page, build.id, [run]);
      await mockTestRun(page, run);
      const { details } = await openProjectPage(project.id, build.id, run.id);

      await expect(
        details.text(
          "Could not load the baseline image. Image sizes cannot be compared.",
        ),
      ).toBeVisible();
      await expect(details.drawAreas).toHaveCount(1);
      await shot("test-run-baseline-image-failed");
    },
  ],

  [
    "test run details with a comment",
    async ({ openProjectPage, page, shot }) => {
      await mockUpdateTestRun(page, TEST_UNRESOLVED);
      const { details } = await openProjectPage(
        project.id,
        build.id,
        TEST_UNRESOLVED.id,
      );

      await expect(details.commentChip).toBeVisible();
      await shot("test-run-comment-chip");
    },
  ],

  [
    "test run details with a long comment",
    async ({ openProjectPage, page, shot }) => {
      const long = {
        ...TEST_UNRESOLVED,
        comment:
          "The footer overlaps the cookie banner on small screens, and the cart badge is clipped.\nSee the design review for the agreed fix.",
      };
      await mockTestRun(page, long);
      await mockUpdateTestRun(page, long);
      const { details } = await openProjectPage(
        project.id,
        build.id,
        TEST_UNRESOLVED.id,
      );

      await expect(details.commentChip).toBeVisible();
      await shot("test-run-long-comment");
    },
  ],

  [
    "test run details without a comment",
    async ({ openProjectPage, page, shot }) => {
      const uncommented = { ...TEST_UNRESOLVED, comment: "" };
      await mockTestRun(page, uncommented);
      await mockUpdateTestRun(page, uncommented);
      const { details } = await openProjectPage(
        project.id,
        build.id,
        TEST_UNRESOLVED.id,
      );

      await expect(details.addCommentBtn).toBeVisible();
      await shot("test-run-no-comment");
    },
  ],

  [
    "add project page",
    async ({ page, authUser, shot }) => {
      void authUser;
      await page.goto("/projects/new");

      const addProjectPage = new AddProjectPage(page);
      await expect(addProjectPage.heading).toBeVisible();
      await expect(addProjectPage.imageComparison).toHaveText(
        ImageComparison.pixelmatch,
      );
      await expect(addProjectPage.threshold).toHaveValue("0.1");
      await shot("add-project");
    },
  ],

  [
    "delete build confirmation",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);

      await projectPage.buildList.openMenu(1);
      await projectPage.buildList.menuItem("Delete build…").click();

      await expect(projectPage.modal.dialog).toContainText(
        "Are you sure you want to delete build",
      );
      await shot("delete-build");
    },
  ],

  [
    "edit CI build id dialog",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);

      await projectPage.buildList.openMenu(1);
      await projectPage.buildList.menuItem("Edit CI build id…").click();

      await expect(projectPage.buildList.ciBuildIdInput).toBeVisible();
      await expect(projectPage.modal.dialog).toBeVisible();
      await shot("edit-ci-build-id");
    },
  ],

  [
    "delete builds confirmation",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);
      await projectPage.buildList.selectAll.click();

      await projectPage.buildList.deleteSelectedBtn.click();

      await expect(projectPage.modal.dialog).toContainText(
        "This also removes their test runs.",
      );
      await shot("delete-builds");
    },
  ],

  [
    "delete test variation confirmation",
    async ({ openTestVariationListPage, shot }) => {
      const listPage = await openTestVariationListPage(project.id);

      await listPage.deleteBtn(TEST_VARIATION_ONE.name).click();

      await expect(listPage.modal.dialog).toContainText(
        `Are you sure you want to delete: ${TEST_VARIATION_ONE.name}?`,
      );
      await shot("delete-test-variation");
    },
  ],

  [
    "delete users confirmation",
    async ({ userListPage, shot }) => {
      await userListPage.table.checkRow(GUEST_USER.id);
      await userListPage.table.checkRow(EDITOR_USER.id);

      await userListPage.deleteSelectedBtn.click();

      await expect(userListPage.modal.dialog).toContainText("Delete 2 users?");
      await shot("delete-users");
    },
  ],

  [
    "delete test runs confirmation",
    async ({ openProjectPage, shot }) => {
      const projectPage = await openProjectPage(project.id, build.id);
      await projectPage.testRunList.checkRow(TEST_UNRESOLVED.id);
      await projectPage.testRunList.checkRow(TEST_RUN_NEW.id);

      await projectPage.testRunList.deleteBtn.click();

      await expect(projectPage.modal.dialog).toContainText(
        "Delete 2 test runs?",
      );
      await shot("delete-test-runs");
    },
  ],

  [
    "project that does not exist",
    async ({ authUser, page, shot }) => {
      void authUser;
      await page.goto("/no-such-project");

      await expect(
        new ProjectPage(page).text("Project not found"),
      ).toBeVisible();
      await shot("project-not-found");
    },
  ],

  [
    "user list with no one matching the search",
    async ({ userListPage, shot }) => {
      await userListPage.searchField.fill("nobody-here");

      await expect(userListPage.text("No people match")).toBeVisible();
      await shot("user-list-no-match");
    },
  ],

  [
    "test run details in a 1024 pixel wide window",
    async ({ openProjectPage, page, shot }) => {
      await page.setViewportSize({ width: 1024, height: 700 });
      const { details } = await openProjectPage(
        project.id,
        build.id,
        TEST_UNRESOLVED.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await shot("test-run-1024");
    },
  ],

  [
    "test run details editing the areas in a 1024 pixel wide window",
    async ({ openProjectPage, page, shot }) => {
      await page.setViewportSize({ width: 1024, height: 700 });
      await mockGetTestRuns(page, build.id, [WITHOUT_AREAS, TEST_RUN_NEW]);
      await mockTestRun(page, WITHOUT_AREAS);
      const { details } = await openProjectPage(
        project.id,
        build.id,
        WITHOUT_AREAS.id,
      );
      await expect(details.drawAreas).toHaveCount(2);

      await details.editAreas.click();

      await expect(details.saveAreas).toBeDisabled();
      await shot("test-run-edit-areas-1024");
    },
  ],
];

for (const scheme of SCHEMES) {
  test.describe(scheme, () => {
    test.use({ colorScheme: scheme });

    test.beforeEach(async ({ page }) => {
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
      await mockDinov2Status(page, { configured: true, available: true });
      await mockImages(page);
    });

    for (const [name, body] of VIEWS) {
      test(`renders ${name}`, body);
    }
  });
}
