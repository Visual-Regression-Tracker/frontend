import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { usersService } from "../services";
import { TEST_USER } from "../_test/test.data.helper";
import LoginPage from "./LoginPage";

vi.mock("../_helpers/useOidcEnabled", () => ({
  useOidcEnabled: vi.fn(() => false),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => mockNavigate,
}));

const openWithFragment = (fragment: string) => {
  window.history.replaceState(null, "", `/login${fragment}`);
};

describe("LoginPage", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("shows the login form", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByTestId("loginBtn")).toBeVisible();
  });

  describe("coming back from the SSO provider with a token", () => {
    it("completes the login with the token and goes home", async () => {
      openWithFragment("#token=jwt-from-idp");
      const completeOidcLogin = vi
        .spyOn(usersService, "completeOidcLogin")
        .mockResolvedValue(TEST_USER);

      renderWithProviders(<LoginPage />, { route: "/login" });

      await waitFor(() =>
        expect(completeOidcLogin).toHaveBeenCalledWith("jwt-from-idp"),
      );
      expect(completeOidcLogin).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    });

    it("removes the token from the address bar", async () => {
      openWithFragment("#token=jwt-from-idp");
      vi.spyOn(usersService, "completeOidcLogin").mockResolvedValue(TEST_USER);

      renderWithProviders(<LoginPage />, { route: "/login" });

      await waitFor(() => expect(window.location.hash).toBe(""));
      expect(window.location.pathname).toBe("/login");
      expect(window.location.href).not.toContain("jwt-from-idp");
    });

    it("shows the error and stays on the page when the token is rejected", async () => {
      openWithFragment("#token=bad-token");
      vi.spyOn(usersService, "completeOidcLogin").mockRejectedValue(
        "Token expired",
      );

      renderWithProviders(<LoginPage />, { route: "/login" });

      expect(await screen.findByText("Token expired")).toBeVisible();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("reads the token among other fragment parameters", async () => {
      openWithFragment("#state=xyz&token=jwt-from-idp");
      const completeOidcLogin = vi
        .spyOn(usersService, "completeOidcLogin")
        .mockResolvedValue(TEST_USER);

      renderWithProviders(<LoginPage />, { route: "/login" });

      await waitFor(() =>
        expect(completeOidcLogin).toHaveBeenCalledWith("jwt-from-idp"),
      );
    });
  });

  describe("coming back from the SSO provider with an error", () => {
    it("tells the user that SSO login failed, without logging in", async () => {
      openWithFragment("#error=access_denied");
      const completeOidcLogin = vi.spyOn(usersService, "completeOidcLogin");

      renderWithProviders(<LoginPage />, { route: "/login" });

      expect(await screen.findByText("SSO login failed.")).toBeVisible();
      expect(completeOidcLogin).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("removes the error from the address bar", async () => {
      openWithFragment("#error=access_denied");

      renderWithProviders(<LoginPage />, { route: "/login" });

      await screen.findByText("SSO login failed.");
      expect(window.location.hash).toBe("");
      expect(window.location.pathname).toBe("/login");
    });

    it("prefers the token when both are present", async () => {
      openWithFragment("#token=jwt-from-idp&error=access_denied");
      const completeOidcLogin = vi
        .spyOn(usersService, "completeOidcLogin")
        .mockResolvedValue(TEST_USER);

      renderWithProviders(<LoginPage />, { route: "/login" });

      await waitFor(() =>
        expect(completeOidcLogin).toHaveBeenCalledWith("jwt-from-idp"),
      );
      expect(screen.queryByText("SSO login failed.")).not.toBeInTheDocument();
    });
  });

  describe("without a token or error in the fragment", () => {
    it.each([
      ["", "no fragment"],
      ["#other=1", "an unrelated fragment"],
    ])("does nothing with %j (%s)", async (fragment) => {
      openWithFragment(fragment);
      const completeOidcLogin = vi.spyOn(usersService, "completeOidcLogin");

      renderWithProviders(<LoginPage />, { route: "/login" });

      await screen.findByTestId("loginBtn");
      expect(completeOidcLogin).not.toHaveBeenCalled();
      expect(screen.queryByText("SSO login failed.")).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.location.hash).toBe(fragment);
    });

    it("ignores an empty token", async () => {
      openWithFragment("#token=");
      const completeOidcLogin = vi.spyOn(usersService, "completeOidcLogin");

      renderWithProviders(<LoginPage />, { route: "/login" });

      await screen.findByTestId("loginBtn");
      expect(completeOidcLogin).not.toHaveBeenCalled();
      expect(screen.queryByText("SSO login failed.")).not.toBeInTheDocument();
    });
  });
});
