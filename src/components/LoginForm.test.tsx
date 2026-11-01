import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { usersService } from "../services";
import { TEST_USER } from "../_test/test.data.helper";
import LoginForm from "./LoginForm";

vi.mock("../_helpers/useOidcEnabled", () => ({
  useOidcEnabled: vi.fn(() => false),
}));

const registerLink = () => screen.queryByText("Create an account");

describe("LoginForm", () => {
  it("logs in with the email and password typed", async () => {
    const login = vi.spyOn(usersService, "login").mockResolvedValue(TEST_USER);
    const { user } = renderWithProviders(<LoginForm />, { route: "/login" });

    await user.type(screen.getByTestId("email"), "some@email.com");
    await user.type(screen.getByTestId("password"), "secret");
    await user.click(screen.getByTestId("loginBtn"));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("some@email.com", "secret"),
    );
  });

  it("does not log in with an invalid email", async () => {
    const login = vi.spyOn(usersService, "login");
    const { user } = renderWithProviders(<LoginForm />, { route: "/login" });

    await user.type(screen.getByTestId("email"), "not an email");
    await user.type(screen.getByTestId("password"), "secret");
    await user.click(screen.getByTestId("loginBtn"));

    expect(await screen.findByText("Enter a valid email.")).toBeVisible();
    expect(login).not.toHaveBeenCalled();
  });

  it("links to registration when it is on", async () => {
    vi.spyOn(usersService, "isRegistrationEnabled").mockResolvedValue(true);
    renderWithProviders(<LoginForm />, { route: "/login" });

    expect(await screen.findByText("Create an account")).toBeVisible();
  });

  it("links to registration when the backend cannot say", async () => {
    vi.spyOn(usersService, "isRegistrationEnabled").mockRejectedValue(
      new Error("offline"),
    );
    renderWithProviders(<LoginForm />, { route: "/login" });

    expect(await screen.findByText("Create an account")).toBeVisible();
  });

  it("does not link to registration when it is off", async () => {
    const isEnabled = vi
      .spyOn(usersService, "isRegistrationEnabled")
      .mockResolvedValue(false);
    renderWithProviders(<LoginForm />, { route: "/login" });

    await waitFor(() => expect(isEnabled).toHaveBeenCalled());
    expect(await screen.findByTestId("loginBtn")).toBeVisible();
    await waitFor(() => expect(registerLink()).not.toBeInTheDocument());
  });
});
