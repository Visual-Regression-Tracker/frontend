import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "../_test/render";
import { usersService, projectsService } from "../services";
import { routes } from "../constants";
import { useHelpDispatch, setHelpSteps } from "../contexts";
import { EDITOR_USER, GUEST_USER, TEST_USER } from "../_test/test.data.helper";
import {
  HEADER_AVATAR_BUTTON_TEST_ID,
  HEADER_HELP_MENU_BUTTON_TEST_ID,
  HEADER_LOGOUT_BUTTON_TEST_ID,
} from "./Header.locators";
import { TAKE_TOUR_BUTTON_TEST_ID } from "./GuidedTour.locators";
import Header from "./Header";

const CurrentLocation = () => (
  <div data-testid="location">{useLocation().pathname}</div>
);

const HelpSteps: React.FunctionComponent<{ target: string }> = ({ target }) => {
  const dispatch = useHelpDispatch();
  React.useEffect(() => {
    setHelpSteps(dispatch, [{ target, content: "First step of the tour" }]);
  }, [dispatch, target]);
  return null;
};

const renderHeader = (options: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(
    <>
      <Header />
      <CurrentLocation />
    </>,
    { route: "/somewhere", ...options },
  );

// menus are keepMounted, so a closed menu's items are in the document but
// hidden from the accessibility tree
const menuItem = (name: string) => screen.getByRole("menuitem", { name });
// a hidden element has no accessible name, so look the item up by its text
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

      expect(screen.getByTestId(TAKE_TOUR_BUTTON_TEST_ID)).toBeVisible();
      expect(menuItem("Open an issue in GitHub")).toBeVisible();
    });

    it("shows the take-tour button and the VRT version", async () => {
      const { user } = renderHeader({ user: TEST_USER });
      // keepMounted: the button is in the document, just not shown
      expect(screen.getByTestId(TAKE_TOUR_BUTTON_TEST_ID)).not.toBeVisible();

      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));
      expect(screen.getByTestId(TAKE_TOUR_BUTTON_TEST_ID)).toBeVisible();

      expect(
        within(screen.getByTestId(TAKE_TOUR_BUTTON_TEST_ID)).getByText(
          "Take a tour",
        ),
      ).toBeVisible();
      expect(screen.getByText(/VRT Version/)).toHaveTextContent(
        "VRT Version : 9.8.7",
      );
    });

    it("opens a new GitHub issue in another tab", async () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const { user } = renderHeader({ user: TEST_USER });

      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));
      await user.click(menuItem("Open an issue in GitHub"));

      expect(open).toHaveBeenCalledWith(
        "https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker/issues/new",
        "_blank",
      );
    });

    it("starts the tour when the first step's target is on the page", async () => {
      const { user } = renderWithProviders(
        <>
          <Header />
          <HelpSteps target="#tour-target" />
          <div id="tour-target">Tour target</div>
        </>,
        { user: TEST_USER },
      );

      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));
      await user.click(screen.getByTestId(TAKE_TOUR_BUTTON_TEST_ID));

      expect(await screen.findByText("First step of the tour")).toBeVisible();
    });

    // a page without a tour (profile, users) must not leave the button stuck
    // for the page visited next
    it("starts the tour once steps arrive after a click on a page without any", async () => {
      const StepsLater = () => {
        const [shown, setShown] = React.useState(false);
        return shown ? (
          <>
            <HelpSteps target="#tour-target" />
            <div id="tour-target">Tour target</div>
          </>
        ) : (
          <button onClick={() => setShown(true)}>Show steps</button>
        );
      };
      const { user } = renderWithProviders(
        <>
          <Header />
          <StepsLater />
        </>,
        { user: TEST_USER },
      );

      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));
      await user.click(screen.getByTestId(TAKE_TOUR_BUTTON_TEST_ID));
      await user.click(screen.getByRole("button", { name: "Show steps" }));
      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));
      await user.click(screen.getByTestId(TAKE_TOUR_BUTTON_TEST_ID));

      expect(await screen.findByText("First step of the tour")).toBeVisible();
    });

    it("stays closed after the last step", async () => {
      const { user } = renderWithProviders(
        <>
          <Header />
          <HelpSteps target="#tour-target" />
          <div id="tour-target">Tour target</div>
        </>,
        { user: TEST_USER },
      );

      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));
      await user.click(screen.getByTestId(TAKE_TOUR_BUTTON_TEST_ID));
      await user.click(await screen.findByRole("button", { name: /^Last/ }));

      await waitFor(() =>
        expect(
          screen.queryByText("First step of the tour"),
        ).not.toBeInTheDocument(),
      );
      // a restarted tour would come back within a frame or two
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(
        screen.queryByText("First step of the tour"),
      ).not.toBeInTheDocument();
    });

    it("does not start the tour when the first step's target is not on the page", async () => {
      const { user } = renderWithProviders(
        <>
          <Header />
          <HelpSteps target="#missing-target" />
        </>,
        { user: TEST_USER },
      );

      await user.click(screen.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID));
      await user.click(screen.getByTestId(TAKE_TOUR_BUTTON_TEST_ID));

      expect(
        screen.queryByText("First step of the tour"),
      ).not.toBeInTheDocument();
    });
  });
});
