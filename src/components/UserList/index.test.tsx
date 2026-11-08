import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { usersService } from "../../services";
import { User } from "../../types";
import { TEST_USER } from "../../_test/test.data.helper";
import UserList from ".";

const ADMIN: User = {
  ...TEST_USER,
  id: "1",
  email: "admin@email.com",
  firstName: "Ada",
  lastName: "Lovelace",
  role: "admin",
  createdAt: "2020-01-02T00:00:00Z",
};
const GUEST: User = {
  ...TEST_USER,
  id: "2",
  email: "guest@email.com",
  firstName: "Gus",
  lastName: "Visitor",
  role: "guest",
  createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
};
const EDITOR: User = {
  ...TEST_USER,
  id: "3",
  email: "editor@email.com",
  firstName: "EW",
  lastName: "Wright",
  role: "editor",
  createdAt: "2020-03-04T00:00:00Z",
};
const USERS = [ADMIN, GUEST, EDITOR];

// jsdom has no layout: without sizes the grid renders only the first columns
const stubLayout = () => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1200);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(1200);
};

type Setup = ReturnType<typeof renderWithProviders>;

const renderUserList = async (users = USERS) => {
  vi.spyOn(usersService, "getAll").mockResolvedValue(users);
  const result = renderWithProviders(<UserList />, { user: ADMIN });
  await screen.findByText(GUEST.email);
  return result;
};

const rowOf = (user: User): HTMLElement => {
  const row = screen.getByText(user.email).closest<HTMLElement>("[role=row]");
  if (!row) {
    throw new Error(`no row for ${user.email}`);
  }
  return row;
};

const selectRow = async (user: Setup["user"], listed: User) =>
  user.click(within(rowOf(listed)).getByRole("checkbox"));

const roleSelect = (listed: User) =>
  within(rowOf(listed)).getByRole("combobox", {
    name: `Role of ${listed.firstName} ${listed.lastName}`,
  });

const emails = () =>
  screen
    .getAllByRole("row")
    .map((row) => row.textContent)
    .slice(1);

describe("UserList", () => {
  beforeEach(stubLayout);

  it("loads the users from the service", async () => {
    const getAll = vi.spyOn(usersService, "getAll").mockResolvedValue(USERS);
    renderWithProviders(<UserList />, { user: ADMIN });

    expect(await screen.findByText(GUEST.email)).toBeVisible();
    expect(getAll).toHaveBeenCalledTimes(1);
  });

  it("shows the error when loading the users fails", async () => {
    vi.spyOn(usersService, "getAll").mockRejectedValue("Cannot load users");
    renderWithProviders(<UserList />, { user: ADMIN });

    expect(await screen.findByText("Cannot load users")).toBeVisible();
  });

  it("lists each person with email, role and joined date", async () => {
    await renderUserList();

    const guest = within(rowOf(GUEST));
    expect(guest.getByText("Gus Visitor")).toBeVisible();
    expect(guest.getByText("guest@email.com")).toBeVisible();
    expect(guest.getByText("2 h ago")).toBeVisible();
    expect(roleSelect(GUEST)).toHaveTextContent("Guest");
    expect(within(rowOf(EDITOR)).getByText("Mar 4, 2020")).toBeVisible();
  });

  it("marks the signed-in user and keeps them out of selection", async () => {
    await renderUserList();

    expect(within(rowOf(ADMIN)).getByText("you")).toBeVisible();
    expect(within(rowOf(ADMIN)).getByRole("checkbox")).toBeDisabled();
    expect(within(rowOf(GUEST)).queryByText("you")).not.toBeInTheDocument();
  });

  it("has no grid toolbar for filters and density", async () => {
    await renderUserList();

    expect(
      screen.queryByRole("button", { name: /^(Filters|Density)/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("explains the roles", async () => {
    await renderUserList();

    const card = screen.getByRole("region", { name: "Roles" });
    expect(
      within(card).getByText("View only. New sign-ups start here."),
    ).toBeVisible();
  });

  describe("sorting", () => {
    const header = (name: string) =>
      screen.getByRole("columnheader", { name: new RegExp(`^${name}`) });

    it("sorts by the Person column, both ways", async () => {
      const { user } = await renderUserList();

      await user.click(header("Person"));
      expect(emails()[0]).toContain("Ada Lovelace");

      await user.click(header("Person"));
      expect(emails()[0]).toContain("Gus Visitor");
    });

    it("sorts by the Role column", async () => {
      const { user } = await renderUserList();

      await user.click(header("Role"));

      expect(emails().map((row) => row?.slice(0, 2))).toEqual([
        "AL",
        "EW",
        "GV",
      ]);
    });
  });

  describe("finding people", () => {
    it("filters by name or email", async () => {
      const { user } = await renderUserList();

      await user.type(
        screen.getByLabelText("Search by name or email"),
        "wright",
      );

      await waitFor(() =>
        expect(screen.queryByText(GUEST.email)).not.toBeInTheDocument(),
      );
      expect(screen.getByText(EDITOR.email)).toBeVisible();
    });

    it("filters by role and clears the filters", async () => {
      const { user } = await renderUserList();

      await user.click(screen.getByRole("button", { name: "Role" }));
      await user.click(
        screen.getByRole("menuitemcheckbox", { name: "Editor" }),
      );

      expect(screen.queryByText(GUEST.email)).not.toBeInTheDocument();
      expect(screen.getByText(EDITOR.email)).toBeVisible();

      await user.keyboard("{Escape}");
      await user.click(screen.getByRole("button", { name: "Clear filters" }));

      expect(await screen.findByText(GUEST.email)).toBeVisible();
    });

    it("drops a hidden selected user from what delete acts on", async () => {
      const remove = vi.spyOn(usersService, "remove").mockResolvedValue(true);
      const { user } = await renderUserList();
      await selectRow(user, GUEST);
      await selectRow(user, EDITOR);

      await user.click(screen.getByRole("button", { name: "Role" }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Guest" }));
      await user.keyboard("{Escape}");
      await user.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(remove).toHaveBeenCalledWith(["2"]));
    });
  });

  describe("new guests banner", () => {
    it("counts guests who joined in the last week", async () => {
      await renderUserList();

      expect(screen.getByText("1 new person is a Guest.")).toBeVisible();
    });

    it("is absent when no guest is new", async () => {
      await renderUserList([
        ADMIN,
        { ...GUEST, createdAt: "2020-01-01T00:00:00Z" },
      ]);

      expect(screen.queryByText(/new (person|people)/)).not.toBeInTheDocument();
    });

    it("shows only Guests from Show Guests", async () => {
      const { user } = await renderUserList();

      await user.click(screen.getByRole("button", { name: "Show Guests" }));

      expect(screen.queryByText(EDITOR.email)).not.toBeInTheDocument();
      expect(screen.getByText(GUEST.email)).toBeVisible();
      expect(screen.getByRole("button", { name: "Role: 1" })).toBeVisible();
    });
  });

  describe("changing a role in the row", () => {
    it("assigns the chosen role to that user", async () => {
      const assignRole = vi
        .spyOn(usersService, "assignRole")
        .mockResolvedValue(GUEST);
      const { user } = await renderUserList();

      await user.click(roleSelect(GUEST));
      await user.click(await screen.findByRole("option", { name: "Editor" }));

      await waitFor(() =>
        expect(assignRole).toHaveBeenCalledWith(GUEST.id, "editor"),
      );
      expect(assignRole).toHaveBeenCalledTimes(1);
      expect(await screen.findByText("Updated")).toBeVisible();
      expect(roleSelect(GUEST)).toHaveTextContent("Editor");
    });

    it("keeps both changes when two roles are changed before either returns", async () => {
      const pending: ((value: User) => void)[] = [];
      vi.spyOn(usersService, "assignRole").mockImplementation(
        () => new Promise<User>((resolve) => pending.push(resolve)),
      );
      const { user } = await renderUserList();

      await user.click(roleSelect(GUEST));
      await user.click(await screen.findByRole("option", { name: "Admin" }));
      await user.click(roleSelect(EDITOR));
      await user.click(await screen.findByRole("option", { name: "Guest" }));
      await waitFor(() => expect(pending).toHaveLength(2));
      pending[0](GUEST);
      await screen.findByText("Updated");
      pending[1](EDITOR);

      await waitFor(() =>
        expect(roleSelect(EDITOR)).toHaveTextContent("Guest"),
      );
      expect(roleSelect(GUEST)).toHaveTextContent("Admin");
    });

    it("does not call the service when the same role is picked again", async () => {
      const assignRole = vi.spyOn(usersService, "assignRole");
      const { user } = await renderUserList();

      await user.click(roleSelect(GUEST));
      await user.click(await screen.findByRole("option", { name: "Guest" }));

      await waitFor(() =>
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
      );
      expect(assignRole).not.toHaveBeenCalled();
    });

    it("keeps the old role and shows the error when assigning fails", async () => {
      vi.spyOn(usersService, "assignRole").mockRejectedValue("Not allowed");
      const { user } = await renderUserList();

      await user.click(roleSelect(GUEST));
      await user.click(await screen.findByRole("option", { name: "Admin" }));

      expect(await screen.findByText("Not allowed")).toBeVisible();
      expect(roleSelect(GUEST)).toHaveTextContent("Guest");
    });
  });

  describe("with users selected", () => {
    it("offers no selection bar until a user is selected", async () => {
      const { user } = await renderUserList();
      expect(
        screen.queryByRole("toolbar", { name: "Selection" }),
      ).not.toBeInTheDocument();

      await selectRow(user, GUEST);

      expect(screen.getByText("1 selected")).toBeVisible();
    });

    it("selects everyone but the signed-in user with Select all", async () => {
      const { user } = await renderUserList();
      await selectRow(user, GUEST);

      await user.click(screen.getByRole("button", { name: "Select all 2" }));

      expect(screen.getByText("2 selected")).toBeVisible();
      expect(within(rowOf(ADMIN)).getByRole("checkbox")).not.toBeChecked();
    });

    it("shows the selected count once, in the selection bar", async () => {
      const { user } = await renderUserList();

      await selectRow(user, GUEST);

      expect(screen.getAllByText(/1 (row )?selected/)).toHaveLength(1);
    });

    it("clears the selection from the close button", async () => {
      const { user } = await renderUserList();
      await selectRow(user, GUEST);

      await user.click(screen.getByRole("button", { name: "Clear selection" }));

      expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
    });

    it("changes the role of every selected user", async () => {
      const assignRole = vi
        .spyOn(usersService, "assignRole")
        .mockResolvedValue(GUEST);
      const { user } = await renderUserList();
      await selectRow(user, GUEST);
      await selectRow(user, EDITOR);

      await user.click(screen.getByRole("button", { name: "Change role" }));
      await user.click(await screen.findByRole("menuitem", { name: "Admin" }));

      await waitFor(() => expect(assignRole).toHaveBeenCalledTimes(2));
      expect(assignRole).toHaveBeenCalledWith("2", "admin");
      expect(assignRole).toHaveBeenCalledWith("3", "admin");
      expect(await screen.findByText("Updated")).toBeVisible();
      expect(roleSelect(EDITOR)).toHaveTextContent("Admin");
    });

    it("shows the error and keeps the role of the user who failed", async () => {
      vi.spyOn(usersService, "assignRole")
        .mockRejectedValueOnce("Not allowed")
        .mockResolvedValueOnce(EDITOR);
      const { user } = await renderUserList();
      await selectRow(user, GUEST);
      await selectRow(user, EDITOR);

      await user.click(screen.getByRole("button", { name: "Change role" }));
      await user.click(await screen.findByRole("menuitem", { name: "Admin" }));

      expect(await screen.findByText("Not allowed")).toBeVisible();
      expect(roleSelect(GUEST)).toHaveTextContent("Guest");
      expect(roleSelect(EDITOR)).toHaveTextContent("Admin");
    });

    it("removes the selected users and drops them from the list", async () => {
      const remove = vi.spyOn(usersService, "remove").mockResolvedValue(true);
      const { user } = await renderUserList();

      await selectRow(user, GUEST);
      await selectRow(user, EDITOR);
      await user.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(remove).toHaveBeenCalledWith(["2", "3"]));
      expect(remove).toHaveBeenCalledTimes(1);
      expect(await screen.findByText("Removed")).toBeVisible();
      await waitFor(() =>
        expect(screen.queryByText(GUEST.email)).not.toBeInTheDocument(),
      );
      expect(screen.queryByText(EDITOR.email)).not.toBeInTheDocument();
      expect(screen.getByText(ADMIN.email)).toBeVisible();
      expect(screen.queryByText("2 selected")).not.toBeInTheDocument();
    });

    it("keeps the users and shows the error when deleting fails", async () => {
      vi.spyOn(usersService, "remove").mockRejectedValue("Cannot remove");
      const { user } = await renderUserList();

      await selectRow(user, GUEST);
      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(await screen.findByText("Cannot remove")).toBeVisible();
      expect(screen.getByText(GUEST.email)).toBeVisible();
    });
  });
});
