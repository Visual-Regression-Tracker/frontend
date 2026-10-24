import React from "react";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import {
  EDITOR_USER,
  GUEST_USER,
  TEST_PROJECT,
  TEST_USER,
} from "../_test/test.data.helper";
import { projectsService } from "../services";
import { Project, User } from "../types";
import ProjectsListPage from "./ProjectListPage";

const project = (id: string, name: string, mainBranchName = "master") =>
  ({ ...TEST_PROJECT, id, name, mainBranchName }) as Project;

const ALPHA = project("alpha-id", "Alpha");
const BETA = project("beta-id", "Beta", "develop");
const GAMMA = project("gamma-id", "Gamma");
const DELTA = project("delta-id", "Delta");

const renderPage = async ({
  user = TEST_USER as User | null,
  projects = [TEST_PROJECT] as Project[],
  favorites = [] as string[],
  recent = [] as string[],
  route = "/projects",
} = {}) => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue(projects);
  vi.spyOn(projectsService, "getFavorites").mockResolvedValue(favorites);
  if (user && recent.length) {
    localStorage.setItem(`recentProjects:${user.id}`, JSON.stringify(recent));
  }
  const result = renderWithProviders(<ProjectsListPage />, { user, route });
  await screen.findByRole("heading", { name: projects[0].name });
  return result;
};

// the project cards' titles, top to bottom
const cardNames = () =>
  screen
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);

const section = (name: string) => screen.getByRole("region", { name });

describe("ProjectListPage", () => {
  afterEach(() => localStorage.clear());

  test.each([
    ["admin", TEST_USER],
    ["editor", EDITOR_USER],
  ])("lets %s create, edit and delete projects", async (_, user) => {
    await renderPage({ user });

    expect(
      screen.getByRole("button", { name: /add project/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("EditIcon")).toBeInTheDocument();
    expect(screen.getByTestId("delete")).toBeInTheDocument();
  });

  test("shows the projects read-only to a guest", async () => {
    await renderPage({ user: GUEST_USER });

    expect(screen.getByRole("link", { name: "Builds" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add project/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("EditIcon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete")).not.toBeInTheDocument();
  });

  test("links a project's builds and variations as pages of the app", async () => {
    await renderPage();

    expect(screen.getByRole("link", { name: "Builds" })).toHaveAttribute(
      "href",
      `/${TEST_PROJECT.id}`,
    );
    expect(screen.getByRole("link", { name: "Variations" })).toHaveAttribute(
      "href",
      `/variations/${TEST_PROJECT.id}`,
    );
  });

  test("lists every project by name when none is starred or opened yet", async () => {
    await renderPage({ projects: [GAMMA, ALPHA, BETA] });

    expect(cardNames()).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(
      screen.queryByRole("region", { name: "Favourites" }),
    ).not.toBeInTheDocument();
  });

  test("puts favourites first, then the recently opened, then the rest", async () => {
    await renderPage({
      projects: [ALPHA, BETA, GAMMA, DELTA],
      favorites: [GAMMA.id],
      recent: [BETA.id, GAMMA.id],
    });

    await within(section("Favourites")).findByRole("heading", {
      name: "Gamma",
    });
    expect(
      within(section("Recently opened")).getByRole("heading", {
        name: "Beta",
      }),
    ).toBeInTheDocument();
    expect(cardNames()).toEqual(["Gamma", "Beta", "Alpha", "Delta"]);
  });

  test("stars a project and moves it to the favourites", async () => {
    const addFavorite = vi
      .spyOn(projectsService, "addFavorite")
      .mockResolvedValue();
    const { user } = await renderPage({ projects: [ALPHA, BETA] });

    await user.click(
      within(screen.getByTestId(`project-${BETA.id}`)).getByRole("button", {
        name: "Add to favourites",
      }),
    );

    expect(addFavorite).toHaveBeenCalledWith(BETA.id);
    const star = within(section("Favourites")).getByRole("button", {
      name: "Remove from favourites",
    });
    expect(star).toHaveAttribute("aria-pressed", "true");
    expect(cardNames()).toEqual(["Beta", "Alpha"]);
  });

  test("takes the star back and says why when starring fails", async () => {
    vi.spyOn(projectsService, "addFavorite").mockRejectedValue("Offline");
    const { user } = await renderPage({ projects: [ALPHA] });

    await user.click(screen.getByRole("button", { name: "Add to favourites" }));

    expect(await screen.findByText("Offline")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add to favourites" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("filters by name, id or branch as you type", async () => {
    const { user } = await renderPage({ projects: [ALPHA, BETA, GAMMA] });

    await user.type(screen.getByRole("searchbox"), "develop");

    expect(cardNames()).toEqual(["Beta"]);
  });

  test("keeps the favourites first among the matches", async () => {
    const { user } = await renderPage({
      projects: [ALPHA, GAMMA],
      favorites: [GAMMA.id],
    });

    await user.type(screen.getByRole("searchbox"), "a");

    expect(cardNames()).toEqual(["Gamma", "Alpha"]);
  });

  test("opens with the search a link carries", async () => {
    await renderPage({
      projects: [ALPHA, BETA],
      route: "/projects?q=alp",
    });

    expect(screen.getByRole("searchbox")).toHaveValue("alp");
    expect(cardNames()).toEqual(["Alpha"]);
  });

  test("says so when nothing matches", async () => {
    const { user } = await renderPage({ projects: [ALPHA] });

    await user.type(screen.getByRole("searchbox"), "zzz");

    expect(screen.getByText("No projects match “zzz”")).toBeInTheDocument();
  });

  test("puts the cursor in the search on /", async () => {
    const { user } = await renderPage({ projects: [ALPHA] });

    await user.keyboard("/");

    expect(screen.getByRole("searchbox")).toHaveFocus();
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
});
