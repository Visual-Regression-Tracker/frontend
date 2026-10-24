import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { TEST_USER } from "../_test/test.data.helper";
import { projectsService } from "../services";
import {
  selectProject,
  useProjectDispatch,
  useProjectState,
} from "./project.context";

const Consumer = () => {
  const { favoriteProjectIds, recentProjectIds } = useProjectState();
  const dispatch = useProjectDispatch();

  return (
    <>
      <p data-testid="favorites">{favoriteProjectIds.join(",")}</p>
      <p data-testid="recent">{recentProjectIds.join(",")}</p>
      <button onClick={() => selectProject(dispatch, "p2")}>Open p2</button>
    </>
  );
};

const RECENT_KEY = `recentProjects:${TEST_USER.id}`;

describe("ProjectProvider", () => {
  beforeEach(() => {
    vi.spyOn(projectsService, "getAll").mockResolvedValue([]);
  });

  afterEach(() => localStorage.clear());

  it("loads the user's favourites after login", async () => {
    vi.spyOn(projectsService, "getFavorites").mockResolvedValue(["p1", "p3"]);

    renderWithProviders(<Consumer />, { user: TEST_USER });

    expect(await screen.findByTestId("favorites")).toHaveTextContent("p1,p3");
  });

  // an API without favourites (older than this frontend) answers 404: the page
  // works without them rather than greeting every login with an error
  it("goes on without favourites and without an error when they cannot be loaded", async () => {
    const getFavorites = vi
      .spyOn(projectsService, "getFavorites")
      .mockRejectedValue("Not Found");

    renderWithProviders(<Consumer />, { user: TEST_USER });

    await vi.waitFor(() => expect(getFavorites).toHaveBeenCalled());
    expect(screen.getByTestId("favorites")).toBeEmptyDOMElement();
    expect(screen.queryByText("Not Found")).not.toBeInTheDocument();
  });

  it("does not ask for favourites while logged out", () => {
    const getFavorites = vi.spyOn(projectsService, "getFavorites");

    renderWithProviders(<Consumer />);

    expect(getFavorites).not.toHaveBeenCalled();
  });

  it("reads the projects the user opened before", async () => {
    vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
    localStorage.setItem(RECENT_KEY, JSON.stringify(["p4", "p1"]));

    renderWithProviders(<Consumer />, { user: TEST_USER });

    expect(await screen.findByTestId("recent")).toHaveTextContent("p4,p1");
  });

  it("remembers an opened project as the most recent one", async () => {
    vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
    localStorage.setItem(RECENT_KEY, JSON.stringify(["p1"]));
    const { user } = renderWithProviders(<Consumer />, { user: TEST_USER });

    await user.click(screen.getByRole("button", { name: "Open p2" }));

    expect(await screen.findByTestId("recent")).toHaveTextContent("p2,p1");
    expect(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")).toEqual([
      "p2",
      "p1",
    ]);
  });
});
