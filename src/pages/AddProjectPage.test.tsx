import { Route, Routes, useLocation } from "react-router-dom";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { projectsService } from "../services";
import { renderWithProviders } from "../_test/render";
import { TEST_PROJECT, TEST_USER } from "../_test/test.data.helper";
import AddProjectPage from "./AddProjectPage";

const CurrentLocation = () => (
  <div data-testid="location">{useLocation().pathname}</div>
);

const renderPage = () => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue([]);
  vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/projects/new" element={<AddProjectPage />} />
        <Route path="*" element={null} />
      </Routes>
      <CurrentLocation />
    </>,
    { user: TEST_USER, route: "/projects/new" },
  );
};

const fillRequired = async (user: ReturnType<typeof renderPage>["user"]) => {
  await user.type(
    await screen.findByRole("textbox", { name: /project name/i }),
    "Beta",
  );
  await user.type(
    screen.getByRole("textbox", { name: /main branch/i }),
    "main",
  );
};

describe("AddProjectPage", () => {
  test("creates the project once however often Create is clicked", async () => {
    const create = vi
      .spyOn(projectsService, "create")
      .mockReturnValue(new Promise(() => {}));
    const { user } = renderPage();
    await fillRequired(user);

    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Beta", mainBranchName: "main" }),
    );
  });

  test("opens the new project after creating it", async () => {
    vi.spyOn(projectsService, "create").mockResolvedValue({
      ...TEST_PROJECT,
      id: "beta-id",
      name: "Beta",
    });
    const { user } = renderPage();
    await fillRequired(user);

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Beta created")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/beta-id");
  });

  test("stays on the page and shows the error when the API refuses", async () => {
    vi.spyOn(projectsService, "create").mockRejectedValue("Name already used");
    const { user } = renderPage();
    await fillRequired(user);

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Name already used")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/projects/new");
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  test("does not create a project with a too short name", async () => {
    const create = vi.spyOn(projectsService, "create");
    const { user } = renderPage();
    await user.type(
      await screen.findByRole("textbox", { name: /project name/i }),
      "B",
    );

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(create).not.toHaveBeenCalled();
  });

  test("Cancel goes back to the project list", async () => {
    const create = vi.spyOn(projectsService, "create");
    const { user } = renderPage();

    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/projects");
    expect(screen.getByTestId("location")).not.toHaveTextContent("new");
    expect(create).not.toHaveBeenCalled();
  });
});
