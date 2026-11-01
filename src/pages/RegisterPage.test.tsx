import { screen } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { usersService } from "../services";
import RegisterPage from "./RegisterPage";

const OFF_MESSAGE =
  "Registration is turned off. Ask an administrator for an account.";

describe("RegisterPage", () => {
  it("shows the registration form when registration is on", async () => {
    vi.spyOn(usersService, "isRegistrationEnabled").mockResolvedValue(true);
    renderWithProviders(<RegisterPage />, { route: "/register" });

    expect(await screen.findByTestId("submit")).toBeVisible();
    expect(screen.queryByText(OFF_MESSAGE)).not.toBeInTheDocument();
  });

  it("shows the registration form when the backend cannot say", async () => {
    vi.spyOn(usersService, "isRegistrationEnabled").mockRejectedValue(
      new Error("offline"),
    );
    renderWithProviders(<RegisterPage />, { route: "/register" });

    expect(await screen.findByTestId("submit")).toBeVisible();
  });

  it("explains that registration is off instead of showing the form", async () => {
    vi.spyOn(usersService, "isRegistrationEnabled").mockResolvedValue(false);
    renderWithProviders(<RegisterPage />, { route: "/register" });

    expect(await screen.findByText(OFF_MESSAGE)).toBeVisible();
    expect(screen.queryByTestId("submit")).not.toBeInTheDocument();
  });
});
