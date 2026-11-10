import { act, screen, waitFor, within } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "../_test/render";
import { usersService, projectsService } from "../services";
import { routes } from "../constants";
import {
  EDITOR_USER,
  GUEST_USER,
  TEST_PROJECT,
  TEST_USER,
} from "../_test/test.data.helper";
import { User } from "../types";
import {
  HEADER_AVATAR_BUTTON_TEST_ID,
  HEADER_HELP_MENU_BUTTON_TEST_ID,
  HEADER_LOGOUT_BUTTON_TEST_ID,
} from "./Header.locators";
import Header from "./Header";

const CurrentLocation = () => (
  <div data-testid="location">{useLocation().pathname}</div>
);

const renderHeader = (options: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(
    <>
      <Header />
      <CurrentLocation />
    </>,
    { route: "/somewhere", ...options },
  );

// keepMounted menus: closed items are hidden from the accessibility tree
const menuItem = (name: string) => screen.getByRole("menuitem", { name });
const mountedMenuItemLabels = () =>
  screen
    .queryAllByRole("menuitem", { hidden: true })
    .map((item) => item.textContent?.trim());

describe("Header", () => {
  beforeEach(() => {
    window._env_ = { VRT_VERSION: "9.8.7", REACT_APP_API_URL: "" };
    vi.spyOn(projectsService, "getAll").mockResolvedValue([]);
  });

  describe("logged out", () => {
    it("shows the logo and help but no avatar", () => {
      renderHeader({ user: null });

      expect(screen.getByAltText("logo")).toBeVisible();
      expect(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID)).toBeVisible();
      expect(
        screen.queryByTestId(HEADER_AVATAR_BUTTON_TEST_ID),
      ).not.toBeInTheDocument();
    });

    it("links the logo to the start page", async () => {
      const { user } = renderHeader({ user: null });

      await user.click(screen.getByAltText("logo"));

      expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    });
  });

  describe("logged in", () => {
    it("shows the initials of the user on the avatar", () => {
      renderHeader({ user: TEST_USER });

      expect(
        screen.getByTestId(HEADER_AVATAR_BUTTON_TEST_ID),
      ).toHaveTextContent("FL");
    });

    it("shows the avatar without throwing when the first name is empty and the last name is missing", () => {
      const nameless = {
        ...TEST_USER,
        firstName: "",
        lastName: undefined,
      } as unknown as User;

      renderHeader({ user: nameless });

      expect(
        screen.getByTestId(HEADER_AVATAR_BUTTON_TEST_ID),
      ).toBeInTheDocument();
    });

    it("keeps the avatar menu closed until the avatar is clicked", async () => {
      const { user } = renderHeader({ user: TEST_USER });
      expect(
        screen.queryByRole("menuitem", { name: "Projects" }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByTestId(HEADER_AVATAR_BUTTON_TEST_ID));

      expect(menuItem("Projects")).toBeVisible();
    });

    it("offers Users, Projects, Profile and Logout to an admin", async () => {
      const { user } = renderHeader({ user: TEST_USER });

      await user.click(screen.getByTestId(HEADER_AVATAR_BUTTON_TEST_ID));

      expect(menuItem("Users")).toHaveAttribute("href", routes.USER_LIST_PAGE);
      expect(menuItem("Projects")).toHaveAttribute(
        "href",
        routes.PROJECT_LIST_PAGE,
      );
      expect(menuItem("Profile")).toHaveAttribute("href", routes.PROFILE_PAGE);
      expect(menuItem("Logout")).toBeVisible();
    });

    it.each([
      ["editor", EDITOR_USER],
      ["guest", GUEST_USER],
    ])("hides Users from a %s", async (_role, loggedInUser) => {
      const { user } = renderHeader({ user: loggedInUser });

      await user.click(screen.getByTestId(HEADER_AVATAR_BUTTON_TEST_ID));

      expect(menuItem("Projects")).toBeVisible();
      expect(menuItem("Profile")).toBeVisible();
      expect(menuItem("Logout")).toBeVisible();
      expect(mountedMenuItemLabels()).toContain("Projects");
      expect(mountedMenuItemLabels()).not.toContain("Users");
    });

    it.each([
      ["Projects", routes.PROJECT_LIST_PAGE],
      ["Profile", routes.PROFILE_PAGE],
      ["Users", routes.USER_LIST_PAGE],
    ])("opens %s and closes the menu", async (name, path) => {
      const { user } = renderHeader({ user: TEST_USER });

      await user.click(screen.getByTestId(HEADER_AVATAR_BUTTON_TEST_ID));
      await user.click(menuItem(name));

      expect(screen.getByTestId("location")).toHaveTextContent(path);
      expect(mountedMenuItemLabels()).toContain(name);
      expect(screen.queryByRole("menuitem", { name })).not.toBeInTheDocument();
    });

    it("logs out: forgets the user, marks the SSO logout and hides the avatar", async () => {
      const logout = vi.spyOn(usersService, "logout");
      const markOidcLoggedOut = vi.spyOn(usersService, "markOidcLoggedOut");
      const { user } = renderHeader({ user: TEST_USER });

      await user.click(screen.getByTestId(HEADER_AVATAR_BUTTON_TEST_ID));
      await user.click(screen.getByTestId(HEADER_LOGOUT_BUTTON_TEST_ID));

      expect(logout).toHaveBeenCalledTimes(1);
      expect(markOidcLoggedOut).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem("user")).toBeNull();
      expect(
        screen.queryByTestId(HEADER_AVATAR_BUTTON_TEST_ID),
      ).not.toBeInTheDocument();
    });
  });

  describe("help menu", () => {
    it("is available when logged out", async () => {
      const { user } = renderHeader({ user: null });

      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));

      expect(menuItem("Open an issue in GitHub")).toBeVisible();
    });

    it("links to the documentation in a new tab", async () => {
      const { user } = renderHeader({ user: TEST_USER });

      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));

      const link = menuItem("Documentation");
      expect(link).toHaveAttribute(
        "href",
        "https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker/wiki",
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("shows the VRT version", async () => {
      const { user } = renderHeader({ user: TEST_USER });

      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));

      expect(screen.getByText(/VRT Version/)).toHaveTextContent(
        "VRT Version : 9.8.7",
      );
    });

    it("opens a new GitHub issue in another tab that cannot reach back", async () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const { user } = renderHeader({ user: TEST_USER });

      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));
      await user.click(menuItem("Open an issue in GitHub"));

      expect(open).toHaveBeenCalledWith(
        "https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker/issues/new",
        "_blank",
        "noopener,noreferrer",
      );
    });
  });

  describe("project shell", () => {
    const OTHER = { ...TEST_PROJECT, id: "other-id", name: "Other project" };

    const renderShell = async (
      route: string,
      {
        projects = [TEST_PROJECT, OTHER],
        loggedInUser = TEST_USER,
        favorites = [] as string[],
      } = {},
    ) => {
      const getAll = vi
        .spyOn(projectsService, "getAll")
        .mockResolvedValue(projects);
      vi.spyOn(projectsService, "getFavorites").mockResolvedValue(favorites);
      const result = renderHeader({ user: loggedInUser, route });
      await vi.waitFor(() => expect(getAll).toHaveBeenCalled());
      await act(() => getAll.mock.results[0].value as Promise<unknown>);
      return result;
    };

    const tabNames = () =>
      within(screen.getByRole("navigation", { name: "Project" }))
        .getAllByRole("tab")
        .map((tab) => tab.textContent);

    it("shows neither the id nor the project tabs for a project that does not exist", async () => {
      await renderShell("/no-such-project");

      const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(
        within(crumb).getByRole("link", { name: "Projects" }),
      ).toBeVisible();
      expect(screen.queryByText("no-such-project")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: "Project" }),
      ).not.toBeInTheDocument();
    });

    it("shows Projects and the project, with the tabs, on the builds page", async () => {
      await renderShell(`/${TEST_PROJECT.id}`);

      const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(
        within(crumb).getByRole("link", { name: "Projects" }),
      ).toHaveAttribute("href", routes.PROJECT_LIST_PAGE);
      expect(
        within(crumb).getByRole("button", { name: TEST_PROJECT.name }),
      ).toBeVisible();
      expect(tabNames()).toEqual([
        "Builds",
        "Variations",
        "Statistics",
        "Settings",
      ]);
      expect(screen.getByRole("tab", { name: "Builds" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it.each([
      ["variations", `/variations/${TEST_PROJECT.id}`, "Variations"],
      ["statistics", `/statistics/${TEST_PROJECT.id}`, "Statistics"],
      ["settings", `/settings/${TEST_PROJECT.id}`, "Settings"],
    ])("marks the %s tab on its own page", async (_tab, route, label) => {
      await renderShell(route);

      expect(screen.getByRole("tab", { name: label })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("links each tab to its page of the project", async () => {
      await renderShell(`/${TEST_PROJECT.id}`);

      expect(screen.getByRole("tab", { name: "Builds" })).toHaveAttribute(
        "href",
        `/${TEST_PROJECT.id}`,
      );
      expect(screen.getByRole("tab", { name: "Variations" })).toHaveAttribute(
        "href",
        `/variations/${TEST_PROJECT.id}`,
      );
      expect(screen.getByRole("tab", { name: "Statistics" })).toHaveAttribute(
        "href",
        `/statistics/${TEST_PROJECT.id}`,
      );
      expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute(
        "href",
        `/settings/${TEST_PROJECT.id}`,
      );
    });

    it("lets an editor see Settings", async () => {
      await renderShell(`/${TEST_PROJECT.id}`, { loggedInUser: EDITOR_USER });

      expect(tabNames()).toContain("Settings");
    });

    it("hides Settings from a guest", async () => {
      await renderShell(`/${TEST_PROJECT.id}`, { loggedInUser: GUEST_USER });

      expect(tabNames()).toEqual(["Builds", "Variations", "Statistics"]);
    });

    it("shows just Profile as the crumb on the profile, without tabs", async () => {
      await renderShell(routes.PROFILE_PAGE);

      const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(crumb).toHaveTextContent(/^Profile$/);
      expect(
        screen.queryByRole("navigation", { name: "Project" }),
      ).not.toBeInTheDocument();
    });

    it("shows Projects / Add project on the add project page, without tabs", async () => {
      await renderShell(routes.PROJECT_NEW_PAGE);

      const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(crumb).toHaveTextContent("Projects/Add project");
      expect(
        screen.queryByRole("navigation", { name: "Project" }),
      ).not.toBeInTheDocument();
    });

    it("has no crumb or tabs on the project list", async () => {
      await renderShell(routes.PROJECT_LIST_PAGE);

      expect(
        screen.queryByRole("navigation", { name: "Breadcrumb" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: "Project" }),
      ).not.toBeInTheDocument();
    });

    it("has no crumb or tabs while logged out", () => {
      renderHeader({ user: null, route: `/${TEST_PROJECT.id}` });

      expect(
        screen.queryByRole("navigation", { name: "Breadcrumb" }),
      ).not.toBeInTheDocument();
    });

    it("shows Admin / Users on the user list, without tabs", async () => {
      await renderShell(routes.USER_LIST_PAGE);

      const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(crumb).toHaveTextContent("Admin/Users");
      expect(
        screen.queryByRole("navigation", { name: "Project" }),
      ).not.toBeInTheDocument();
    });

    it("selects the project of the page", async () => {
      await renderShell(`/variations/${OTHER.id}`);

      expect(
        within(
          screen.getByRole("navigation", { name: "Breadcrumb" }),
        ).getByRole("button", { name: OTHER.name }),
      ).toBeVisible();
    });

    it("shows the project id without a menu when the project list failed to load", async () => {
      vi.spyOn(projectsService, "getAll").mockRejectedValue("API is down");
      vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
      renderHeader({ user: TEST_USER, route: `/${TEST_PROJECT.id}` });

      const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
      await waitFor(() =>
        expect(crumb).toHaveTextContent(`Projects/${TEST_PROJECT.id}`),
      );
      expect(within(crumb).queryByRole("button")).not.toBeInTheDocument();
    });

    describe("the project menu", () => {
      const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
        await user.click(
          screen.getByRole("button", { name: TEST_PROJECT.name }),
        );
        return screen.findByRole("searchbox", { name: "Find project" });
      };

      it("announces the menu as a named dialog and the button as expanded", async () => {
        const { user } = await renderShell(`/${TEST_PROJECT.id}`);
        const trigger = screen.getByRole("button", { name: TEST_PROJECT.name });
        expect(trigger).toHaveAttribute("aria-expanded", "false");

        await openMenu(user);

        expect(trigger).toHaveAttribute("aria-expanded", "true");
        expect(
          screen.getByRole("dialog", { name: "Switch project" }),
        ).toBeVisible();
      });

      it("goes to the same tab of the project picked", async () => {
        const { user } = await renderShell(`/variations/${TEST_PROJECT.id}`);
        await openMenu(user);

        await user.click(screen.getByRole("menuitem", { name: OTHER.name }));

        expect(screen.getByTestId("location")).toHaveTextContent(
          `/variations/${OTHER.id}`,
        );
      });

      it("finds a project by what is typed", async () => {
        const { user } = await renderShell(`/${TEST_PROJECT.id}`);
        const search = await openMenu(user);

        await user.type(search, "other");

        expect(
          screen.getAllByRole("menuitem").map((item) => item.textContent),
        ).toEqual([OTHER.name]);
      });

      it("picks the first match on Enter", async () => {
        const { user } = await renderShell(`/${TEST_PROJECT.id}`);
        const search = await openMenu(user);

        await user.type(search, "other{Enter}");

        expect(screen.getByTestId("location")).toHaveTextContent(
          `/${OTHER.id}`,
        );
      });

      it("moves from the search to the list on the down arrow", async () => {
        const { user } = await renderShell(`/${TEST_PROJECT.id}`);
        const search = await openMenu(user);

        await user.type(search, "{ArrowDown}");

        expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();
      });

      it("says so when nothing matches", async () => {
        const { user } = await renderShell(`/${TEST_PROJECT.id}`);
        const search = await openMenu(user);

        await user.type(search, "zzz");

        expect(screen.getByText("No projects match")).toBeVisible();
      });

      it("groups favourites apart from the other projects", async () => {
        const { user } = await renderShell(`/${TEST_PROJECT.id}`, {
          favorites: [OTHER.id],
        });
        await openMenu(user);

        await waitFor(() =>
          expect(screen.getByText("Favourites")).toBeVisible(),
        );
        expect(screen.getByText("Other projects")).toBeVisible();
        expect(screen.queryByText("Recently opened")).not.toBeInTheDocument();
      });

      it("keeps the group headers in view while the list scrolls and out of keyboard navigation", async () => {
        const { user } = await renderShell(`/${TEST_PROJECT.id}`, {
          favorites: [OTHER.id],
        });
        await openMenu(user);

        const header = await screen.findByText("Favourites");

        expect(header).toHaveStyle({ position: "sticky" });
        expect(header).not.toHaveAttribute("role", "menuitem");
        await user.keyboard("{ArrowDown}");
        expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();
      });

      it("puts each group header right before the projects of that group", async () => {
        const { user } = await renderShell(`/${TEST_PROJECT.id}`, {
          favorites: [OTHER.id],
        });
        await openMenu(user);
        await screen.findByText("Favourites");

        const menu = screen.getByRole("menu");
        const sequence = Array.from(menu.children).map((child) =>
          child.getAttribute("role") === "menuitem"
            ? `item:${child.textContent}`
            : `header:${child.textContent}`,
        );

        expect(sequence).toEqual([
          "header:Favourites",
          `item:${OTHER.name}`,
          "header:Other projects",
          `item:${TEST_PROJECT.name}`,
        ]);
      });
    });
  });
});
