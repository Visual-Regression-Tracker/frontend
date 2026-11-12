import { useEffect, type ReactNode } from "react";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "./render";
import { TEST_PROJECT, TEST_USER } from "./test.data.helper";
import {
  selectProject,
  useProjectDispatch,
  useProjectState,
  useTestRunState,
} from "../contexts";
import { buildsService, testRunService } from "../services";
import { Build, TestRun } from "../types";
import TestRunList from "../components/TestRunList";

export type User = ReturnType<typeof renderWithProviders>["user"];

export const build = (id: string) => ({ id, ciBuildId: `ci-${id}` }) as Build;

export const renderList = (
  runs: TestRun[],
  extra: ReactNode = null,
  user: typeof TEST_USER | null = null,
) => {
  vi.spyOn(buildsService, "getDetails").mockImplementation((id) =>
    Promise.resolve(build(id)),
  );
  vi.spyOn(testRunService, "getList").mockResolvedValue(runs);

  return renderWithProviders(
    <>
      {extra}
      <TestRunList />
    </>,
    { route: "/?buildId=build-a", user },
  );
};

export const NavigationOrder = () => {
  const { filteredSortedTestRunIds } = useTestRunState();
  return (
    <output data-testid="navigationOrder">
      {(filteredSortedTestRunIds ?? []).join(",")}
    </output>
  );
};

export const navigationOrder = () =>
  screen.getByTestId("navigationOrder").textContent;

export const dataRows = () => screen.getAllByRole("row").slice(1);
export const rowOf = (name: string) =>
  screen.getByText(name).closest<HTMLElement>('[role="row"]') as HTMLElement;
export const tickRow = (name: string) =>
  // the box's label flips to "Unselect row" once it is ticked
  within(rowOf(name)).getByRole("checkbox", { name: /select row/i });

export const SelectProject = () => {
  const dispatch = useProjectDispatch();
  const { projectList, selectedProjectId } = useProjectState();
  useEffect(() => selectProject(dispatch, TEST_PROJECT.id), [dispatch]);
  return projectList.length > 0 && selectedProjectId === TEST_PROJECT.id ? (
    <div data-testid="project-ready" />
  ) : null;
};
