import React from "react";
import { render } from "@testing-library/react";
import { useProjectState, useUserState } from "../contexts";
import {
  EDITOR_USER,
  GUEST_USER,
  TEST_PROJECT,
  TEST_USER,
} from "../_test/test.data.helper";
import { User } from "../types";
import ProjectsListPage from "./ProjectListPage";

vi.mock("../contexts", () => ({
  useUserState: vi.fn(),
  useProjectState: vi.fn(),
  useProjectDispatch: vi.fn(),
  useHelpDispatch: vi.fn(),
  setHelpSteps: vi.fn(),
  setProjectEditState: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

const renderAs = (user?: User) => {
  vi.mocked(useUserState).mockReturnValue({
    loggedIn: true,
    user,
    userList: [],
  });
  // only what the page reads
  vi.mocked(useProjectState).mockReturnValue({
    projectList: [TEST_PROJECT],
    projectEditState: TEST_PROJECT,
  } as unknown as ReturnType<typeof useProjectState>);

  return render(<ProjectsListPage />);
};

describe("ProjectListPage", () => {
  test.each([
    ["admin", TEST_USER],
    ["editor", EDITOR_USER],
  ])("lets %s create, edit and delete projects", (_, user) => {
    const page = renderAs(user);

    expect(
      page.getByRole("heading", { name: TEST_PROJECT.name }),
    ).toBeInTheDocument();
    expect(
      page.getByRole("button", { name: /add project/i }),
    ).toBeInTheDocument();
    expect(page.getByTestId("EditIcon")).toBeInTheDocument();
    expect(page.getByTestId("delete")).toBeInTheDocument();
  });

  test.each([
    ["guest", GUEST_USER],
    ["a user without user data", undefined],
  ])("shows the projects read-only to %s", (_, user) => {
    const page = renderAs(user);

    expect(
      page.getByRole("heading", { name: TEST_PROJECT.name }),
    ).toBeInTheDocument();
    expect(page.getByRole("link", { name: "Builds" })).toBeInTheDocument();
    expect(
      page.queryByRole("button", { name: /add project/i }),
    ).not.toBeInTheDocument();
    expect(page.queryByTestId("EditIcon")).not.toBeInTheDocument();
    expect(page.queryByTestId("delete")).not.toBeInTheDocument();
  });
});
