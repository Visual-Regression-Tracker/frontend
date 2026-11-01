import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { projectsService } from "../services";
import { useProjectState } from "../contexts";
import { TEST_PROJECT, TEST_USER } from "../_test/test.data.helper";
import ProjectSelect from "./ProjectSelect";

const FIRST = { ...TEST_PROJECT, id: "first-id", name: "First project" };
const SECOND = { ...TEST_PROJECT, id: "second-id", name: "Second project" };
const THIRD = { ...TEST_PROJECT, id: "third-id", name: "Third project" };

const SelectedProjectId = () => (
  <div data-testid="selectedProjectId">
    {useProjectState().selectedProjectId ?? "none"}
  </div>
);

const renderProjectSelect = ({
  projectId,
  onProjectSelect = vi.fn(),
  projects = [FIRST, SECOND],
  favorites = [] as string[],
  recent = [] as string[],
}: {
  projectId?: string;
  onProjectSelect?: (id: string) => void;
  projects?: (typeof FIRST)[];
  favorites?: string[];
  recent?: string[];
} = {}) => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue(projects);
  vi.spyOn(projectsService, "getFavorites").mockResolvedValue(favorites);
  if (recent.length) {
    localStorage.setItem(
      `recentProjects:${TEST_USER.id}`,
      JSON.stringify(recent),
    );
  }
  return renderWithProviders(
    <>
      <ProjectSelect projectId={projectId} onProjectSelect={onProjectSelect} />
      <SelectedProjectId />
    </>,
    { user: TEST_USER },
  );
};

const optionNames = () =>
  within(screen.getByRole("listbox"))
    .getAllByRole("option")
    .map((option) => option.textContent);

describe("ProjectSelect", () => {
  afterEach(() => localStorage.clear());

  it("shows nothing while there are no projects", async () => {
    const getAll = vi.spyOn(projectsService, "getAll").mockResolvedValue([]);
    renderWithProviders(<ProjectSelect onProjectSelect={vi.fn()} />, {
      user: TEST_USER,
    });

    await vi.waitFor(() => expect(getAll).toHaveBeenCalled());

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Project")).not.toBeInTheDocument();
  });

  it("asks to select a project when none is chosen", async () => {
    renderProjectSelect();

    const field = await screen.findByRole("combobox", { name: "Project" });
    expect(field).toHaveValue("");
    expect(field).toHaveAttribute("placeholder", "Select project");
  });

  it("lists every project by name to choose from", async () => {
    const { user } = renderProjectSelect({ projects: [SECOND, FIRST] });

    await user.click(await screen.findByRole("combobox"));

    expect(optionNames()).toEqual(["First project", "Second project"]);
  });

  it("lists favourites first, then the recently opened, then the rest", async () => {
    const { user } = renderProjectSelect({
      projects: [FIRST, SECOND, THIRD],
      favorites: [THIRD.id],
      recent: [SECOND.id],
    });
    await vi.waitFor(() =>
      expect(projectsService.getFavorites).toHaveBeenCalled(),
    );

    await user.click(await screen.findByRole("combobox"));

    expect(await screen.findByText("Favourites")).toBeVisible();
    expect(screen.getByText("Recently opened")).toBeVisible();
    expect(screen.getByText("Other projects")).toBeVisible();
    expect(optionNames()).toEqual([
      "Third project",
      "Second project",
      "First project",
    ]);
  });

  it("narrows the list to what is typed", async () => {
    const { user } = renderProjectSelect();

    await user.type(await screen.findByRole("combobox"), "sec");

    expect(optionNames()).toEqual(["Second project"]);
  });

  it("reports the id of the project picked", async () => {
    const onProjectSelect = vi.fn();
    const { user } = renderProjectSelect({ onProjectSelect });

    await user.click(await screen.findByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Second project" }));

    expect(onProjectSelect).toHaveBeenCalledTimes(1);
    expect(onProjectSelect).toHaveBeenCalledWith("second-id");
  });

  it("picks from the keyboard", async () => {
    const onProjectSelect = vi.fn();
    const { user } = renderProjectSelect({ onProjectSelect });

    await user.type(
      await screen.findByRole("combobox"),
      "sec{ArrowDown}{Enter}",
    );

    expect(onProjectSelect).toHaveBeenCalledWith("second-id");
  });

  it("selects the project given by id and shows its name", async () => {
    renderProjectSelect({ projectId: "second-id" });

    expect(await screen.findByRole("combobox")).toHaveValue("Second project");
    expect(screen.getByTestId("selectedProjectId")).toHaveTextContent(
      "second-id",
    );
  });

  it("leaves the selection alone when no project id is given", async () => {
    renderProjectSelect();

    await screen.findByRole("combobox");

    expect(screen.getByTestId("selectedProjectId")).toHaveTextContent("none");
  });
});
