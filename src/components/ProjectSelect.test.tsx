import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { projectsService } from "../services";
import { useProjectState } from "../contexts";
import { TEST_PROJECT, TEST_USER } from "../_test/test.data.helper";
import ProjectSelect from "./ProjectSelect";

const FIRST = { ...TEST_PROJECT, id: "first-id", name: "First project" };
const SECOND = { ...TEST_PROJECT, id: "second-id", name: "Second project" };

const SelectedProjectId = () => (
  <div data-testid="selectedProjectId">
    {useProjectState().selectedProjectId ?? "none"}
  </div>
);

const renderProjectSelect = ({
  projectId,
  onProjectSelect = vi.fn(),
}: {
  projectId?: string;
  onProjectSelect?: (id: string) => void;
} = {}) =>
  renderWithProviders(
    <>
      <ProjectSelect projectId={projectId} onProjectSelect={onProjectSelect} />
      <SelectedProjectId />
    </>,
    { user: TEST_USER },
  );

describe("ProjectSelect", () => {
  it("shows nothing while there are no projects", async () => {
    const getAll = vi.spyOn(projectsService, "getAll").mockResolvedValue([]);
    renderProjectSelect();

    await vi.waitFor(() => expect(getAll).toHaveBeenCalled());

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Project")).not.toBeInTheDocument();
  });

  it("asks to select a project when none is chosen", async () => {
    vi.spyOn(projectsService, "getAll").mockResolvedValue([FIRST, SECOND]);
    renderProjectSelect();

    expect(await screen.findByRole("combobox")).toHaveTextContent(
      "Select project",
    );
    expect(screen.getByText("Project")).toBeVisible();
  });

  it("lists every project to choose from", async () => {
    vi.spyOn(projectsService, "getAll").mockResolvedValue([FIRST, SECOND]);
    const { user } = renderProjectSelect();

    await user.click(await screen.findByRole("combobox"));

    expect(screen.getByRole("option", { name: "First project" })).toBeVisible();
    expect(
      screen.getByRole("option", { name: "Second project" }),
    ).toBeVisible();
    // the placeholder is shown but cannot be picked
    expect(
      screen.getByRole("option", { name: "Select project" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("reports the id of the project picked", async () => {
    vi.spyOn(projectsService, "getAll").mockResolvedValue([FIRST, SECOND]);
    const onProjectSelect = vi.fn();
    const { user } = renderProjectSelect({ onProjectSelect });

    await user.click(await screen.findByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Second project" }));

    expect(onProjectSelect).toHaveBeenCalledTimes(1);
    expect(onProjectSelect).toHaveBeenCalledWith("second-id");
  });

  it("selects the project given by id and shows its name", async () => {
    vi.spyOn(projectsService, "getAll").mockResolvedValue([FIRST, SECOND]);
    renderProjectSelect({ projectId: "second-id" });

    expect(await screen.findByRole("combobox")).toHaveTextContent(
      "Second project",
    );
    expect(screen.getByTestId("selectedProjectId")).toHaveTextContent(
      "second-id",
    );
  });

  it("leaves the selection alone when no project id is given", async () => {
    vi.spyOn(projectsService, "getAll").mockResolvedValue([FIRST, SECOND]);
    renderProjectSelect();

    await screen.findByRole("combobox");

    expect(screen.getByTestId("selectedProjectId")).toHaveTextContent("none");
  });
});
