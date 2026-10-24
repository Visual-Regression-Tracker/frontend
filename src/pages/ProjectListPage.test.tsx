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

jest.mock("../contexts", () => ({
  useUserState: jest.fn(),
  useProjectState: jest.fn(),
  useProjectDispatch: jest.fn(),
  useHelpDispatch: jest.fn(),
  setHelpSteps: jest.fn(),
  setProjectEditState: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
}));

const renderAs = (user?: User) => {
  (useUserState as jest.Mock).mockReturnValue({
    loggedIn: true,
    user,
    userList: [],
  });
  (useProjectState as jest.Mock).mockReturnValue({
    projectList: [TEST_PROJECT],
    projectEditState: TEST_PROJECT,
  });

  return render(<ProjectsListPage />);
};

describe("ProjectListPage", () => {
  test.each([
    ["admin", TEST_USER],
    ["editor", EDITOR_USER],
  ])("lets %s create, edit and delete projects", (_, user) => {
    const page = renderAs(user);

    expect(page.getByText(`Name: ${TEST_PROJECT.name}`)).toBeInTheDocument();
    expect(page.getByRole("button", { name: "add" })).toBeInTheDocument();
    expect(page.getByTestId("EditIcon")).toBeInTheDocument();
    expect(page.getByTestId("delete")).toBeInTheDocument();
  });

  test.each([
    ["guest", GUEST_USER],
    ["a user without user data", undefined],
  ])("shows the projects read-only to %s", (_, user) => {
    const page = renderAs(user);

    expect(page.getByText(`Name: ${TEST_PROJECT.name}`)).toBeInTheDocument();
    expect(page.getByRole("link", { name: "Builds" })).toBeInTheDocument();
    expect(page.queryByRole("button", { name: "add" })).not.toBeInTheDocument();
    expect(page.queryByTestId("EditIcon")).not.toBeInTheDocument();
    expect(page.queryByTestId("delete")).not.toBeInTheDocument();
  });
});
