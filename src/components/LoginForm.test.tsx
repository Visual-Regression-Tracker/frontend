import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { usersService } from "../services";
import { TEST_USER } from "../_test/test.data.helper";
import LoginForm from "./LoginForm";

vi.mock("../_helpers/useOidcEnabled", () => ({
  useOidcEnabled: vi.fn(() => false),
}));

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
});
