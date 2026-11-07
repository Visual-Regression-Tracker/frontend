import { Route, Routes, useNavigate } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { buildResult } from "../_test/statistics.fixture";
import {
  TEST_PROJECT,
  TEST_USER,
  TEST_VARIATION_ONE,
} from "../_test/test.data.helper";
import {
  projectsService,
  statisticsService,
  testVariationService,
} from "../services";
import ProjectStatisticsPage from "./ProjectStatisticsPage";

const PROJECT = { ...TEST_PROJECT, maxBuildAllowed: 50 };
const OTHER = { ...TEST_PROJECT, id: "other-id", name: "Other" };

const OpenOther = () => {
  const navigate = useNavigate();
  return (
    <button onClick={() => void navigate(`/statistics/${OTHER.id}`)}>
      Open other
    </button>
  );
};

const renderPage = (projectId = PROJECT.id) => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue([PROJECT, OTHER]);
  vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
  vi.spyOn(testVariationService, "getList").mockResolvedValue([
    { ...TEST_VARIATION_ONE, branchName: "main" },
    { ...TEST_VARIATION_ONE, id: "v2", branchName: "feature" },
    { ...TEST_VARIATION_ONE, id: "v3", branchName: "main" },
  ]);
  return renderWithProviders(
    <Routes>
      <Route
        path="/statistics/:projectId"
        element={
          <>
            <OpenOther />
            <ProjectStatisticsPage />
          </>
        }
      />
    </Routes>,
    { user: TEST_USER, route: `/statistics/${projectId}` },
  );
};

const FOUR_BUILDS = [1, 2, 3, 4].map((n) => buildResult(n, { ok: n }));

describe("ProjectStatisticsPage", () => {
  it("shows a bar per kept build and how many of the limit are kept", async () => {
    const getResults = vi
      .spyOn(statisticsService, "getResults")
      .mockResolvedValue(FOUR_BUILDS);
    renderPage();

    expect(
      await screen.findAllByRole("link", { name: /Build #/ }),
    ).toHaveLength(4);
    expect(screen.getByText("4 builds kept (limit 50)")).toBeVisible();
    expect(getResults).toHaveBeenCalledWith(PROJECT.id, undefined);
  });

  it("asks only for the chosen branch", async () => {
    const getResults = vi
      .spyOn(statisticsService, "getResults")
      .mockResolvedValue(FOUR_BUILDS);
    const { user } = renderPage();

    await user.click(await screen.findByRole("combobox", { name: "Branch" }));
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "All branches",
      "feature",
      "main",
    ]);
    await user.click(screen.getByRole("option", { name: "feature" }));

    await waitFor(() =>
      expect(getResults).toHaveBeenLastCalledWith(PROJECT.id, "feature"),
    );
  });

  it("starts on all branches when another project is opened", async () => {
    const getResults = vi
      .spyOn(statisticsService, "getResults")
      .mockResolvedValue(FOUR_BUILDS);
    const { user } = renderPage();
    await user.click(await screen.findByRole("combobox", { name: "Branch" }));
    await user.click(screen.getByRole("option", { name: "feature" }));
    await waitFor(() =>
      expect(getResults).toHaveBeenLastCalledWith(PROJECT.id, "feature"),
    );

    await user.click(screen.getByRole("button", { name: "Open other" }));

    await waitFor(() =>
      expect(getResults).toHaveBeenLastCalledWith(OTHER.id, undefined),
    );
  });

  it("says so when the project has no builds", async () => {
    vi.spyOn(statisticsService, "getResults").mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("No builds yet")).toBeVisible();
    expect(screen.getByText("0 builds kept (limit 50)")).toBeVisible();
  });

  it("names the branch when it has no builds", async () => {
    vi.spyOn(statisticsService, "getResults").mockImplementation(
      (_project, branch) => Promise.resolve(branch ? [] : FOUR_BUILDS),
    );
    const { user } = renderPage();

    await user.click(await screen.findByRole("combobox", { name: "Branch" }));
    await user.click(screen.getByRole("option", { name: "feature" }));

    expect(
      await screen.findByText("Branch feature has no builds."),
    ).toBeVisible();
  });

  it("explains that trends need more builds", async () => {
    vi.spyOn(statisticsService, "getResults").mockResolvedValue([
      buildResult(1, { ok: 1 }),
    ]);
    renderPage();

    expect(await screen.findByText("Only a few builds so far")).toBeVisible();
    expect(screen.getByText("1 build kept (limit 50)")).toBeVisible();
  });

  it("does not warn about few builds when there are enough", async () => {
    vi.spyOn(statisticsService, "getResults").mockResolvedValue(FOUR_BUILDS);
    renderPage();

    await screen.findAllByRole("link", { name: /Build #/ });
    expect(screen.queryByText("Only a few builds so far")).toBeNull();
  });

  it("shows a placeholder while the results load", async () => {
    vi.spyOn(statisticsService, "getResults").mockReturnValue(
      new Promise(() => {}),
    );
    renderPage();

    expect(
      await screen.findByRole("status", { name: "Loading statistics" }),
    ).toBeVisible();
  });

  it("reports a failed request and shows the empty state", async () => {
    vi.spyOn(statisticsService, "getResults").mockRejectedValue("Boom");
    renderPage();

    expect(await screen.findByText("Boom")).toBeVisible();
    expect(screen.getByText("No builds yet")).toBeVisible();
  });

  it("says so when the project does not exist", async () => {
    vi.spyOn(statisticsService, "getResults").mockResolvedValue([]);
    renderPage("missing-id");

    expect(await screen.findByText("Project not found")).toBeVisible();
  });
});
