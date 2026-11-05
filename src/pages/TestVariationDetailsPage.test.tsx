import { screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "../_test/render";
import {
  TEST_PROJECT,
  TEST_USER,
  NOISE_ANALYSIS_NOISE,
  TEST_VARIATION_ONE,
  testRunMock,
} from "../_test/test.data.helper";
import { formatShortDate } from "../_helpers/format.helper";
import {
  projectsService,
  staticService,
  testVariationService,
} from "../services";
import { useProjectState } from "../contexts";
import { ImageComparison } from "../types/imageComparison";
import { TestStatus } from "../types/testStatus";
import { ProjectBreadcrumb } from "../components/ProjectBreadcrumb";
import TestVariationDetailsPage from "./TestVariationDetailsPage";
import { CurrentSearch, currentLocation } from "../_test/location";

const LATEST_RUN = {
  ...testRunMock,
  id: "latest-run-id",
  buildId: "latest-build-id",
  status: TestStatus.approved,
};
const OLDER_RUN = {
  ...testRunMock,
  id: "older-run-id",
  buildId: "older-build-id",
  status: TestStatus.unresolved,
};

const VARIATION = {
  ...TEST_VARIATION_ONE,
  baselines: [
    {
      ...TEST_VARIATION_ONE.baselines[0],
      id: "baseline-latest",
      baselineName: "latest.png",
      createdAt: "2020-09-14T06:57:25.845Z",
      testRun: LATEST_RUN,
    },
    {
      ...TEST_VARIATION_ONE.baselines[1],
      id: "baseline-older",
      baselineName: "older.png",
      createdAt: "2020-09-12T06:57:25.845Z",
      testRun: OLDER_RUN,
      user: undefined,
    },
    {
      ...TEST_VARIATION_ONE.baselines[1],
      id: "baseline-manual",
      baselineName: "manual.png",
      createdAt: "2020-09-10T06:57:25.845Z",
      testRun: undefined,
      user: undefined,
    },
  ],
};

const ProjectsLoaded = () => {
  const { projectList } = useProjectState();
  return projectList.length > 0 ? <span data-testid="projects-loaded" /> : null;
};

const renderPage = (route = `/variations/details/${VARIATION.id}`) =>
  renderWithProviders(
    <>
      <Routes>
        <Route
          path="/variations/details/:testVariationId"
          element={<TestVariationDetailsPage />}
        />
      </Routes>
      <CurrentSearch />
      <ProjectsLoaded />
    </>,
    { user: TEST_USER, route },
  );

const baselineCards = () =>
  document.querySelectorAll<HTMLElement>(".MuiCard-root");

const historyRows = () => screen.getAllByRole("listitem");

const loaded = () =>
  screen.findByRole("heading", { level: 2, name: /Baseline history/ });

describe("TestVariationDetailsPage", () => {
  test("continues the breadcrumb with the project, Variations and the variation", async () => {
    vi.spyOn(projectsService, "getAll").mockResolvedValue([TEST_PROJECT]);
    vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);
    renderWithProviders(
      <>
        <ProjectBreadcrumb route={{ kind: "variation" }} />
        <Routes>
          <Route
            path="/variations/details/:testVariationId"
            element={<TestVariationDetailsPage />}
          />
        </Routes>
      </>,
      { user: TEST_USER, route: `/variations/details/${VARIATION.id}` },
    );

    const crumb = await screen.findByRole("navigation", {
      name: "Breadcrumb",
    });

    await waitFor(() =>
      expect(crumb).toHaveTextContent(
        `Projects/${TEST_PROJECT.name}/Variations/${VARIATION.name}`,
      ),
    );
    expect(
      within(crumb).getByRole("link", { name: "Variations" }),
    ).toHaveAttribute("href", `/variations/${VARIATION.projectId}`);
  });

  test("loads the variation in the route", async () => {
    const getDetails = vi
      .spyOn(testVariationService, "getDetails")
      .mockResolvedValue(VARIATION);

    renderPage();

    expect(
      await screen.findByRole("heading", { name: VARIATION.name }),
    ).toBeInTheDocument();
    expect(getDetails).toHaveBeenCalledExactlyOnceWith(VARIATION.id);
  });

  test("shows the variation's name, branch and tags", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);

    renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: VARIATION.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(VARIATION.branchName)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1 }).parentElement,
    ).toHaveTextContent(
      `${VARIATION.branchName}${VARIATION.os} · ${VARIATION.device} · ${VARIATION.browser} · ${VARIATION.viewport} · ${VARIATION.customTags}`,
    );
  });

  test("shows the noise hint beside the status of an unresolved baseline run only", async () => {
    const noisy = {
      ...VARIATION,
      baselines: [
        {
          ...VARIATION.baselines[0],
          testRun: { ...LATEST_RUN, noiseAnalysis: NOISE_ANALYSIS_NOISE },
        },
        {
          ...VARIATION.baselines[1],
          testRun: { ...OLDER_RUN, noiseAnalysis: NOISE_ANALYSIS_NOISE },
        },
      ],
    };
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(noisy);
    vi.spyOn(projectsService, "getAll").mockResolvedValue([TEST_PROJECT]);

    renderPage();

    await loaded();
    await screen.findByTestId("noise-hint-chip");
    const [latest, older] = historyRows();
    expect(
      within(latest).queryByTestId("noise-hint-chip"),
    ).not.toBeInTheDocument();
    expect(within(older).getByTestId("noise-hint-chip")).toHaveTextContent(
      "Likely noise",
    );
  });

  test("leaves the noise hint out of the history for a project without the analysis", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue({
      ...VARIATION,
      baselines: [
        {
          ...VARIATION.baselines[1],
          testRun: { ...OLDER_RUN, noiseAnalysis: NOISE_ANALYSIS_NOISE },
        },
      ],
    });
    vi.spyOn(projectsService, "getAll").mockResolvedValue([
      { ...TEST_PROJECT, imageComparison: ImageComparison.vlm },
    ]);

    renderPage();

    await loaded();
    await screen.findByTestId("projects-loaded");
    expect(screen.queryByTestId("noise-hint-chip")).not.toBeInTheDocument();
  });

  test("lists the baselines in the order the API gives them, each with its image", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);

    renderPage();

    expect(await loaded()).toHaveTextContent("Baseline history (3)");
    const cards = baselineCards();
    expect(cards).toHaveLength(3);
    expect(
      [...cards].map((card) =>
        within(card).getByRole("img").getAttribute("src"),
      ),
    ).toEqual([
      staticService.getImage("latest.png"),
      staticService.getImage("older.png"),
      staticService.getImage("manual.png"),
    ]);
  });

  test("shows the version, who approved it, when, and the status of its run", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);

    renderPage();

    await loaded();
    const [latest, older, manual] = historyRows();
    expect(
      within(latest).getByText(
        `v3 · ${TEST_USER.firstName} ${TEST_USER.lastName}`,
      ),
    ).toBeInTheDocument();
    expect(
      within(latest).getByText(formatShortDate("2020-09-14T06:57:25.845Z")),
    ).toBeInTheDocument();
    expect(within(latest).getByText(TestStatus.approved)).toBeInTheDocument();
    expect(within(older).getByText("v2")).toBeInTheDocument();
    expect(within(older).getByText(TestStatus.unresolved)).toBeInTheDocument();
    expect(
      within(manual).queryByText(TestStatus.approved),
    ).not.toBeInTheDocument();
  });

  test("the author's email is in the avatar tooltip, not on the row", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);
    const { user } = renderPage();
    await loaded();
    const [latest] = historyRows();

    expect(within(latest).queryByText(TEST_USER.email)).not.toBeInTheDocument();
    await user.hover(
      within(latest).getByText(
        `${TEST_USER.firstName[0]}${TEST_USER.lastName[0]}`,
      ),
    );

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      TEST_USER.email,
    );
  });

  test("Test run opens the run of that baseline in its build", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);
    const { user } = renderPage();
    await loaded();
    const [, older] = historyRows();

    await user.click(within(older).getByRole("button", { name: "Test run" }));

    expect(currentLocation()).toBe(
      `/${TEST_PROJECT.id}?buildId=${OLDER_RUN.buildId}&testId=${OLDER_RUN.id}`,
    );
  });

  test("a baseline made without a run has no Test run button", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);
    renderPage();
    await loaded();
    const [, , manual] = historyRows();

    expect(
      within(manual).queryByRole("button", { name: "Test run" }),
    ).not.toBeInTheDocument();
  });

  test("a version in the list scrolls to its image", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { user } = renderPage();
    await loaded();
    const [, older] = historyRows();

    await user.click(
      within(older).getByRole("button", { name: "Show version 2" }),
    );

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView.mock.contexts[0]).toBe(baselineCards()[1]);
  });

  test("shows an empty history for a variation without baselines", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue({
      ...VARIATION,
      baselines: [],
    });

    renderPage();

    expect(await loaded()).toHaveTextContent("Baseline history (0)");
    expect(baselineCards()).toHaveLength(0);
  });

  test("shows the error and no page content when the load fails", async () => {
    vi.spyOn(testVariationService, "getDetails").mockRejectedValue("Not found");

    renderPage();

    expect(await screen.findByText("Not found")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByText(/Baseline history/)).not.toBeInTheDocument();
  });
});
