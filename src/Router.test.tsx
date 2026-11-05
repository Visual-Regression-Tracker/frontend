import { screen } from "@testing-library/react";
import { renderWithProviders } from "./_test/render";
import { EDITOR_USER, GUEST_USER, TEST_USER } from "./_test/test.data.helper";
import { projectsService } from "./services";
import Router from "./Router";
import { User } from "./types";

vi.mock("./pages/ProjectPage", () => ({
  default: () => <div>builds page</div>,
}));
vi.mock("./pages/ProjectListPage", () => ({
  default: () => <div>project list page</div>,
}));
vi.mock("./pages/ProjectSettingsPage", () => ({
  default: () => <div>settings page</div>,
}));
vi.mock("./pages/ProjectStatisticsPage", () => ({
  default: () => <div>statistics page</div>,
}));

const renderRoute = (route: string, user: User | null = TEST_USER) => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue([]);
  vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
  return renderWithProviders(<Router />, { route, user });
};

describe("Router project routes", () => {
  it("opens the builds page on the project id", async () => {
    renderRoute("/some-project");

    expect(await screen.findByText("builds page")).toBeVisible();
  });

  it("opens settings, not the builds page of a project called settings", async () => {
    renderRoute("/settings/some-project");

    expect(await screen.findByText("settings page")).toBeVisible();
    expect(screen.queryByText("builds page")).not.toBeInTheDocument();
  });

  it("opens statistics, not the builds page of a project called statistics", async () => {
    renderRoute("/statistics/some-project");

    expect(await screen.findByText("statistics page")).toBeVisible();
    expect(screen.queryByText("builds page")).not.toBeInTheDocument();
  });

  it.each([
    ["admin", TEST_USER],
    ["editor", EDITOR_USER],
  ])("lets %s open settings", async (_role, user) => {
    renderRoute("/settings/some-project", user);

    expect(await screen.findByText("settings page")).toBeVisible();
  });

  it("sends a guest from settings to the project list", async () => {
    renderRoute("/settings/some-project", GUEST_USER);

    expect(await screen.findByText("project list page")).toBeVisible();
    expect(screen.queryByText("settings page")).not.toBeInTheDocument();
  });

  it.each([
    ["admin", TEST_USER],
    ["editor", EDITOR_USER],
    ["guest", GUEST_USER],
  ])("lets %s open statistics", async (_role, user) => {
    renderRoute("/statistics/some-project", user);

    expect(await screen.findByText("statistics page")).toBeVisible();
  });
});
