import { screen } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { TEST_PROJECT, TEST_USER } from "../_test/test.data.helper";
import { ImageComparison } from "../types/imageComparison";
import { projectsService } from "../services";
import {
  selectProject,
  useNoiseAnalysisAvailable,
  useProjectDispatch,
  useProjectState,
  useSelectedProject,
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

describe("useNoiseAnalysisAvailable", () => {
  const Availability = () => {
    const dispatch = useProjectDispatch();
    const available = useNoiseAnalysisAvailable();
    const selected = useSelectedProject();

    return (
      <>
        <p data-testid="selected">{selected?.name}</p>
        <p data-testid="available">{String(available)}</p>
        <button onClick={() => selectProject(dispatch, TEST_PROJECT.id)}>
          Open
        </button>
      </>
    );
  };

  const open = async (project: Partial<typeof TEST_PROJECT>) => {
    vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
    vi.spyOn(projectsService, "getAll").mockResolvedValue([
      { ...TEST_PROJECT, ...project },
    ]);
    const { user } = renderWithProviders(<Availability />, {
      user: TEST_USER,
    });
    await vi.waitFor(() => expect(projectsService.getAll).toHaveBeenCalled());
    await user.click(await screen.findByRole("button", { name: "Open" }));
    await screen.findByText(TEST_PROJECT.name);
  };

  afterEach(() => localStorage.clear());

  it("is off before a project is selected", () => {
    vi.spyOn(projectsService, "getAll").mockResolvedValue([]);

    renderWithProviders(<Availability />, { user: TEST_USER });

    expect(screen.getByTestId("available")).toHaveTextContent("false");
  });

  it("is on for the selected project with the blur stage enabled", async () => {
    await open({});

    expect(screen.getByTestId("available")).toHaveTextContent("true");
  });

  it.each([
    ["the VLM comparator", { imageComparison: ImageComparison.vlm }],
    [
      "the blur stage disabled",
      { noiseAnalysisConfig: '{"blur":{"enabled":false}}' },
    ],
  ])("is off for %s", async (_, project) => {
    await open(project);

    expect(screen.getByTestId("available")).toHaveTextContent("false");
  });

  it("looks up the given project instead of the selected one", async () => {
    const other = { ...TEST_PROJECT, id: "other" };
    vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
    vi.spyOn(projectsService, "getAll").mockResolvedValue([
      { ...TEST_PROJECT, imageComparison: ImageComparison.vlm },
      other,
    ]);
    const ForOther = () => {
      const dispatch = useProjectDispatch();
      return (
        <>
          <p data-testid="for-other">
            {String(useNoiseAnalysisAvailable(other.id))}
          </p>
          <p data-testid="for-selected">
            {String(useNoiseAnalysisAvailable())}
          </p>
          <button onClick={() => selectProject(dispatch, TEST_PROJECT.id)}>
            Open
          </button>
        </>
      );
    };
    const { user } = renderWithProviders(<ForOther />, { user: TEST_USER });
    await vi.waitFor(() => expect(projectsService.getAll).toHaveBeenCalled());
    await user.click(await screen.findByRole("button", { name: "Open" }));

    await vi.waitFor(() =>
      expect(screen.getByTestId("for-other")).toHaveTextContent("true"),
    );
    expect(screen.getByTestId("for-selected")).toHaveTextContent("false");
  });
});
