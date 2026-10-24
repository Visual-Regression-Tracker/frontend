import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { projectsService, usersService } from "../services";
import { TEST_PROJECT, TEST_USER } from "../_test/test.data.helper";
import { useOidcEnabled } from "../_helpers/useOidcEnabled";
import ProfilePage from "./ProfilePage";

vi.mock("../_helpers/useOidcEnabled", () => ({
  useOidcEnabled: vi.fn(() => false),
}));

type User = ReturnType<typeof renderWithProviders>["user"];

const clear = async (user: User, field: HTMLElement) => {
  await user.clear(field);
};

// the page has two forms, each with its own submit button: user details first
const submitDetails = (user: User) =>
  user.click(screen.getAllByTestId("submit")[0]);
const submitPassword = (user: User) =>
  user.click(screen.getAllByTestId("submit")[1]);

// resolves once the project list has loaded, so nothing updates after a test
const renderPage = async () => {
  const rendered = renderWithProviders(<ProfilePage />, { user: TEST_USER });
  await screen.findByRole("combobox", { name: /Project/ });
  return rendered;
};

describe("ProfilePage", () => {
  beforeEach(() => {
    window._env_ = {
      REACT_APP_API_URL: "http://api.test",
      VRT_VERSION: "test",
    };
    vi.mocked(useOidcEnabled).mockReturnValue(false);
    vi.spyOn(projectsService, "getAll").mockResolvedValue([TEST_PROJECT]);
  });

  describe("user details", () => {
    it("starts with the details of the logged in user", async () => {
      await renderPage();

      expect(screen.getByTestId("firstName")).toHaveValue(TEST_USER.firstName);
      expect(screen.getByTestId("lastName")).toHaveValue(TEST_USER.lastName);
      expect(screen.getByTestId("email")).toHaveValue(TEST_USER.email);
    });

    it("shows the role of the user, which cannot be changed here", async () => {
      await renderPage();

      const role = screen.getAllByRole("combobox")[0];
      expect(role).toHaveTextContent("Admin");
      expect(role).toHaveAttribute("aria-disabled", "true");
    });

    it("sends the edited names and email to update the user", async () => {
      const update = vi.spyOn(usersService, "update").mockResolvedValue({
        ...TEST_USER,
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
      });
      const { user } = await renderPage();

      await clear(user, screen.getByTestId("firstName"));
      await user.type(screen.getByTestId("firstName"), "Ada");
      await clear(user, screen.getByTestId("lastName"));
      await user.type(screen.getByTestId("lastName"), "Lovelace");
      await clear(user, screen.getByTestId("email"));
      await user.type(screen.getByTestId("email"), "ada@example.com");
      await submitDetails(user);

      await waitFor(() =>
        expect(update).toHaveBeenCalledWith({
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
        }),
      );
      expect(await screen.findByText("User updated")).toBeVisible();
    });

    it("sends the unchanged details when only submitted", async () => {
      const update = vi
        .spyOn(usersService, "update")
        .mockResolvedValue(TEST_USER);
      const { user } = await renderPage();

      await submitDetails(user);

      await waitFor(() =>
        expect(update).toHaveBeenCalledWith({
          firstName: TEST_USER.firstName,
          lastName: TEST_USER.lastName,
          email: TEST_USER.email,
        }),
      );
    });

    it("shows the error when updating the user fails", async () => {
      vi.spyOn(usersService, "update").mockRejectedValue("Email already used");
      const { user } = await renderPage();

      await submitDetails(user);

      expect(await screen.findByText("Email already used")).toBeVisible();
      expect(screen.queryByText("User updated")).not.toBeInTheDocument();
    });

    it("does not update with an invalid email", async () => {
      const update = vi.spyOn(usersService, "update");
      const { user } = await renderPage();

      await clear(user, screen.getByTestId("email"));
      await user.type(screen.getByTestId("email"), "not an email");
      await submitDetails(user);

      expect(
        await screen.findByText("Enter valid email address"),
      ).toBeVisible();
      expect(update).not.toHaveBeenCalled();
    });

    it.each([
      ["first name", "firstName"],
      ["last name", "lastName"],
    ])(
      "does not update when the %s is a single character",
      async (_label, field) => {
        const update = vi.spyOn(usersService, "update");
        const { user } = await renderPage();

        await clear(user, screen.getByTestId(field));
        await user.type(screen.getByTestId(field), "a");
        await submitDetails(user);

        expect(
          await screen.findByText("Enter at least two characters."),
        ).toBeVisible();
        expect(update).not.toHaveBeenCalled();
      },
    );

    it("does not update when a name is emptied", async () => {
      const update = vi.spyOn(usersService, "update");
      const { user } = await renderPage();

      await clear(user, screen.getByTestId("firstName"));
      await submitDetails(user);

      expect(update).not.toHaveBeenCalled();
    });
  });

  describe("change password", () => {
    it("sends the new password and empties the field", async () => {
      const changePassword = vi
        .spyOn(usersService, "changePassword")
        .mockResolvedValue(true);
      const { user } = await renderPage();

      await user.type(screen.getByLabelText(/^New password/), "brand-new");
      await submitPassword(user);

      await waitFor(() =>
        expect(changePassword).toHaveBeenCalledWith("brand-new"),
      );
      expect(await screen.findByText("Password updated")).toBeVisible();
      expect(screen.getByLabelText(/^New password/)).toHaveValue("");
    });

    it("does not touch the user details when the password is changed", async () => {
      vi.spyOn(usersService, "changePassword").mockResolvedValue(true);
      const update = vi.spyOn(usersService, "update");
      const { user } = await renderPage();

      await user.type(screen.getByLabelText(/^New password/), "brand-new");
      await submitPassword(user);

      await screen.findByText("Password updated");
      expect(update).not.toHaveBeenCalled();
    });

    it("shows the error and keeps the typed password when changing fails", async () => {
      vi.spyOn(usersService, "changePassword").mockRejectedValue(
        "Password too weak",
      );
      const { user } = await renderPage();

      await user.type(screen.getByLabelText(/^New password/), "brand-new");
      await submitPassword(user);

      expect(await screen.findByText("Password too weak")).toBeVisible();
      expect(screen.queryByText("Password updated")).not.toBeInTheDocument();
      expect(screen.getByLabelText(/^New password/)).toHaveValue("brand-new");
    });

    it("does not change a one character password", async () => {
      const changePassword = vi.spyOn(usersService, "changePassword");
      const { user } = await renderPage();

      await user.type(screen.getByLabelText(/^New password/), "a");
      await submitPassword(user);

      expect(
        await screen.findByText("Enter at least two characters."),
      ).toBeVisible();
      expect(changePassword).not.toHaveBeenCalled();
    });

    it("does not change an empty password", async () => {
      const changePassword = vi.spyOn(usersService, "changePassword");
      const { user } = await renderPage();

      await submitPassword(user);

      expect(changePassword).not.toHaveBeenCalled();
    });

    it("can show the typed new password", async () => {
      const { user } = await renderPage();
      await user.type(screen.getByLabelText(/^New password/), "brand-new");

      await user.click(
        screen.getByRole("button", { name: "toggle password visibility" }),
      );

      expect(screen.getByLabelText(/^New password/)).toHaveAttribute(
        "type",
        "text",
      );
    });
  });

  describe("with single sign-on", () => {
    it("offers no password change and locks the email", async () => {
      vi.mocked(useOidcEnabled).mockReturnValue(true);
      await renderPage();

      expect(screen.queryByText("Change password")).not.toBeInTheDocument();
      expect(screen.getByTestId("email")).toBeDisabled();
      expect(screen.getByTestId("firstName")).toBeEnabled();
    });

    it("keeps the email locked until it is known whether SSO is on", async () => {
      vi.mocked(useOidcEnabled).mockReturnValue(undefined);
      await renderPage();

      expect(screen.queryByText("Change password")).not.toBeInTheDocument();
      expect(screen.getByTestId("email")).toBeDisabled();
    });

    it("still updates the names", async () => {
      vi.mocked(useOidcEnabled).mockReturnValue(true);
      const update = vi
        .spyOn(usersService, "update")
        .mockResolvedValue(TEST_USER);
      const { user } = await renderPage();

      await clear(user, screen.getByTestId("firstName"));
      await user.type(screen.getByTestId("firstName"), "Ada");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() =>
        expect(update).toHaveBeenCalledWith({
          firstName: "Ada",
          lastName: TEST_USER.lastName,
          email: TEST_USER.email,
        }),
      );
    });
  });

  describe("api key and configuration examples", () => {
    it("shows the api key of the user", async () => {
      await renderPage();

      const card = screen.getByText("Api key").closest(".MuiCard-root");
      expect(card).not.toBeNull();
      expect(
        within(card as HTMLElement).getByText(TEST_USER.apiKey),
      ).toBeVisible();
    });

    it("shows a config file with the api url, key and the default project", async () => {
      await renderPage();

      const config = (
        screen.getByDisplayValue(/"apiKey"/) as HTMLTextAreaElement
      ).value;
      expect(config).toContain('"apiUrl": "http://api.test"');
      expect(config).toContain(`"apiKey": "${TEST_USER.apiKey}"`);
      expect(config).toContain('"project": "Default project"');
    });

    it("shows environment variables on the second tab", async () => {
      const { user } = await renderPage();

      await user.click(screen.getByRole("tab", { name: "ENV variables" }));

      const env = (
        screen.getByDisplayValue(/VRT_APIKEY/) as HTMLTextAreaElement
      ).value;
      expect(env).toContain('VRT_APIURL="http://api.test"');
      expect(env).toContain(`VRT_APIKEY="${TEST_USER.apiKey}"`);
      expect(screen.queryByDisplayValue(/"apiKey"/)).not.toBeInTheDocument();
    });

    it("puts the selected project into the examples", async () => {
      const { user } = await renderPage();

      await user.click(
        await screen.findByRole("combobox", { name: /Project/ }),
      );
      await user.click(
        within(screen.getByRole("listbox")).getByRole("option", {
          name: TEST_PROJECT.name,
        }),
      );

      await waitFor(() =>
        expect(
          (screen.getByDisplayValue(/"apiKey"/) as HTMLTextAreaElement).value,
        ).toContain(`"project": "${TEST_PROJECT.id}"`),
      );
    });
  });
});
