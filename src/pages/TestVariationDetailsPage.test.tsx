import { fireEvent, screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "../_test/render";
import {
  TEST_PROJECT,
  TEST_USER,
  TEST_VARIATION_ONE,
  testRunMock,
} from "../_test/test.data.helper";
import { formatDateTime } from "../_helpers/format.helper";
import { staticService, testVariationService } from "../services";
import { TestStatus } from "../types/testStatus";
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
    </>,
    { user: TEST_USER, route },
  );

const baselineCards = () =>
  document.querySelectorAll<HTMLElement>(".MuiCard-root");

describe("TestVariationDetailsPage", () => {
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
    expect(screen.getByText(`OS: ${VARIATION.os}`)).toBeInTheDocument();
    expect(screen.getByText(`Device: ${VARIATION.device}`)).toBeInTheDocument();
    expect(
      screen.getByText(`Browser: ${VARIATION.browser}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Viewport: ${VARIATION.viewport}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Custom Tags: ${VARIATION.customTags}`),
    ).toBeInTheDocument();
  });

  test("lists the baselines in the order the API gives them, each with its image", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);

    renderPage();

    await screen.findByRole("heading", { level: 2, name: /Baseline history/ });
    expect(
      screen.getByRole("heading", { level: 2, name: /Baseline history/ }),
    ).toHaveTextContent("Baseline history3");
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

  test("shows who approved a baseline, when, and the status of its run", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);

    renderPage();

    await screen.findByRole("heading", { level: 2, name: /Baseline history/ });
    const [latest, older, manual] = [...baselineCards()];
    expect(
      within(latest).getByText(
        `${TEST_USER.firstName} ${TEST_USER.lastName} <${TEST_USER.email}>`,
      ),
    ).toBeInTheDocument();
    expect(
      within(latest).getByText(formatDateTime("2020-09-14T06:57:25.845Z")),
    ).toBeInTheDocument();
    expect(within(latest).getByText(TestStatus.approved)).toBeInTheDocument();
    expect(within(older).getByText(TestStatus.unresolved)).toBeInTheDocument();
    expect(within(older).queryByText(/</)).not.toBeInTheDocument();
    expect(
      within(manual).queryByText(TestStatus.approved),
    ).not.toBeInTheDocument();
  });

  test("Test Run opens the run of that baseline in its build", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);
    const { user } = renderPage();
    await screen.findByRole("heading", { level: 2, name: /Baseline history/ });
    const [, older] = [...baselineCards()];

    await user.click(within(older).getByRole("button", { name: "Test Run" }));

    expect(currentLocation()).toBe(
      `/${TEST_PROJECT.id}?buildId=${OLDER_RUN.buildId}&testId=${OLDER_RUN.id}`,
    );
  });

  test("Test Run is disabled for a baseline made without a run", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue(VARIATION);
    renderPage();
    await screen.findByRole("heading", { level: 2, name: /Baseline history/ });
    const [, , manual] = [...baselineCards()];

    const button = within(manual).getByRole("button", { name: "Test Run" });
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(currentLocation()).toBe(`/variations/details/${VARIATION.id}`);
  });

  test("shows an empty history for a variation without baselines", async () => {
    vi.spyOn(testVariationService, "getDetails").mockResolvedValue({
      ...VARIATION,
      baselines: [],
    });

    renderPage();

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: /Baseline history/,
      }),
    ).toHaveTextContent("Baseline history0");
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
