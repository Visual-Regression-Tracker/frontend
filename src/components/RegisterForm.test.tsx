import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { usersService } from "../services";
import { TEST_USER } from "../_test/test.data.helper";
import RegisterForm from "./RegisterForm";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => mockNavigate,
}));

type User = ReturnType<typeof renderWithProviders>["user"];

const fillForm = async (
  user: User,
  values: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  } = {},
) => {
  const {
    firstName = "Ada",
    lastName = "Lovelace",
    email = "ada@example.com",
    password = "secret",
  } = values;
  await user.type(screen.getByTestId("firstName"), firstName);
  await user.type(screen.getByTestId("lastName"), lastName);
  await user.type(screen.getByTestId("email"), email);
  await user.type(screen.getByTestId("password"), password);
};

describe("RegisterForm", () => {
  it("registers with the names, email and password typed, then logs in and goes home", async () => {
    const register = vi
      .spyOn(usersService, "register")
      .mockResolvedValue(TEST_USER);
    const login = vi.spyOn(usersService, "login").mockResolvedValue(TEST_USER);
    const { user } = renderWithProviders(<RegisterForm />, {
      route: "/register",
    });

    await fillForm(user);
    await user.click(screen.getByTestId("submit"));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith(
        "Ada",
        "Lovelace",
        "ada@example.com",
        "secret",
      ),
    );
    expect(
      await screen.findByText("Successfully created account."),
    ).toBeVisible();
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("ada@example.com", "secret"),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
  });

  it("shows the error and does not log in when registering fails", async () => {
    vi.spyOn(usersService, "register").mockRejectedValue("Email is taken");
    const login = vi.spyOn(usersService, "login");
    const { user } = renderWithProviders(<RegisterForm />, {
      route: "/register",
    });

    await fillForm(user);
    await user.click(screen.getByTestId("submit"));

    expect(await screen.findByText("Email is taken")).toBeVisible();
    expect(login).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not register with an invalid email", async () => {
    const register = vi.spyOn(usersService, "register");
    const { user } = renderWithProviders(<RegisterForm />, {
      route: "/register",
    });

    await fillForm(user, { email: "not an email" });
    await user.click(screen.getByTestId("submit"));

    expect(await screen.findByText("Enter a valid email.")).toBeVisible();
    expect(register).not.toHaveBeenCalled();
  });

  it.each([
    ["first name", "firstName"],
    ["last name", "lastName"],
    ["password", "password"],
  ])(
    "does not register when the %s is a single character",
    async (_label, field) => {
      const register = vi.spyOn(usersService, "register");
      const { user } = renderWithProviders(<RegisterForm />, {
        route: "/register",
      });

      await fillForm(user, { [field]: "a" });
      await user.click(screen.getByTestId("submit"));

      expect(
        await screen.findByText("Enter at least two characters."),
      ).toBeVisible();
      expect(register).not.toHaveBeenCalled();
    },
  );

  it("does not register an empty form", async () => {
    const register = vi.spyOn(usersService, "register");
    const { user } = renderWithProviders(<RegisterForm />, {
      route: "/register",
    });

    await user.click(screen.getByTestId("submit"));

    expect(register).not.toHaveBeenCalled();
  });
});
