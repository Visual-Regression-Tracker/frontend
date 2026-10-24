import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { usersService } from "../../services";
import { Role, User } from "../../types";
import { TEST_USER } from "../../_test/test.data.helper";
import UserList from ".";

const ADMIN: User = {
  ...TEST_USER,
  id: "1",
  email: "admin@email.com",
  firstName: "Ada",
  lastName: "Lovelace",
  role: "admin",
};
const GUEST: User = {
  ...TEST_USER,
  id: "2",
  email: "guest@email.com",
  firstName: "Gus",
  lastName: "Visitor",
  role: "guest",
};
const EDITOR: User = {
  ...TEST_USER,
  id: "3",
  email: "editor@email.com",
  firstName: "Ed",
  lastName: "Wright",
  role: "editor",
};
const USERS = [ADMIN, GUEST, EDITOR];

// jsdom has no layout, so the grid sees a zero-width viewport and renders only
// the first columns; give every element a size so all columns are rendered
const stubLayout = () => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1200);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(1200);
};

const renderUserList = async () => {
  vi.spyOn(usersService, "getAll").mockResolvedValue(USERS);
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

const selectRow = async (
  user: ReturnType<typeof renderWithProviders>["user"],
  listed: User,
) => user.click(within(rowOf(listed)).getByRole("checkbox"));

// the tooltip's label sits on a span around the (possibly disabled) button
const deleteButton = (): HTMLButtonElement => {
  const button = screen
    .getByLabelText("Delete selected rows.")
    .querySelector("button");
  if (!button) {
    throw new Error("no delete button");
  }
  return button;
};

describe("UserList", () => {
  beforeEach(stubLayout);

  it("loads the users from the service", async () => {
    const getAll = vi.spyOn(usersService, "getAll").mockResolvedValue(USERS);
    renderWithProviders(<UserList />, { user: ADMIN });

    expect(await screen.findByText(GUEST.email)).toBeVisible();
    expect(getAll).toHaveBeenCalledTimes(1);
  });

  it("lists every user with name and readable role", async () => {
    await renderUserList();

    USERS.forEach((listed) => {
      const row = within(rowOf(listed));
      expect(row.getByText(listed.email)).toBeVisible();
      expect(row.getByText(listed.firstName)).toBeVisible();
      expect(row.getByText(listed.lastName)).toBeVisible();
      expect(row.getByText(Role[listed.role])).toBeVisible();
    });
  });

  it("disables delete until a user is selected", async () => {
    const { user } = await renderUserList();
    expect(deleteButton()).toBeDisabled();

    await selectRow(user, GUEST);

    expect(deleteButton()).toBeEnabled();
  });

  describe("changing a role", () => {
    it("assigns the chosen role to that user", async () => {
      const assignRole = vi
        .spyOn(usersService, "assignRole")
        .mockResolvedValue(GUEST);
      const { user } = await renderUserList();

      await user.dblClick(within(rowOf(GUEST)).getByText("Guest"));
      await user.click(await screen.findByRole("option", { name: "Editor" }));
      await user.keyboard("{Enter}");

      await waitFor(() =>
        expect(assignRole).toHaveBeenCalledWith(GUEST.id, "editor"),
      );
      expect(assignRole).toHaveBeenCalledTimes(1);
      expect(await screen.findByText("Updated")).toBeVisible();
      expect(within(rowOf(GUEST)).getByText("Editor")).toBeVisible();
    });

    it("does not call the service when the same role is picked again", async () => {
      const assignRole = vi.spyOn(usersService, "assignRole");
      const { user } = await renderUserList();

      await user.dblClick(within(rowOf(GUEST)).getByText("Guest"));
      await user.click(await screen.findByRole("option", { name: "Guest" }));
      await user.keyboard("{Enter}");

      await waitFor(() =>
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
      );
      expect(assignRole).not.toHaveBeenCalled();
    });

    it("shows the error when assigning the role fails", async () => {
      vi.spyOn(usersService, "assignRole").mockRejectedValue("Not allowed");
      const { user } = await renderUserList();

      await user.dblClick(within(rowOf(GUEST)).getByText("Guest"));
      await user.click(await screen.findByRole("option", { name: "Admin" }));
      await user.keyboard("{Enter}");

      expect(await screen.findByText("Not allowed")).toBeVisible();
    });
  });

  describe("deleting users", () => {
    it("removes the selected users and drops them from the list", async () => {
      const remove = vi.spyOn(usersService, "remove").mockResolvedValue(true);
      const { user } = await renderUserList();

      await selectRow(user, GUEST);
      await selectRow(user, EDITOR);
      await user.click(deleteButton());

      await waitFor(() => expect(remove).toHaveBeenCalledWith(["2", "3"]));
      expect(remove).toHaveBeenCalledTimes(1);
      expect(await screen.findByText("Removed")).toBeVisible();
      await waitFor(() =>
        expect(screen.queryByText(GUEST.email)).not.toBeInTheDocument(),
      );
      expect(screen.queryByText(EDITOR.email)).not.toBeInTheDocument();
      expect(screen.getByText(ADMIN.email)).toBeVisible();
    });

    it("refuses to delete the logged in user", async () => {
      const remove = vi.spyOn(usersService, "remove").mockResolvedValue(true);
      const { user } = await renderUserList();

      await selectRow(user, ADMIN);
      await user.click(deleteButton());

      expect(
        await screen.findByText("You cannot delete yourself."),
      ).toBeVisible();
      expect(remove).not.toHaveBeenCalled();
      expect(screen.getByText(ADMIN.email)).toBeVisible();
    });

    it("refuses to delete when the logged in user is among the selected", async () => {
      const remove = vi.spyOn(usersService, "remove").mockResolvedValue(true);
      const { user } = await renderUserList();

      await selectRow(user, GUEST);
      await selectRow(user, ADMIN);
      await user.click(deleteButton());

      expect(
        await screen.findByText("You cannot delete yourself."),
      ).toBeVisible();
      expect(remove).not.toHaveBeenCalled();
    });

    it("keeps the users and shows the error when deleting fails", async () => {
      vi.spyOn(usersService, "remove").mockRejectedValue("Cannot remove");
      const { user } = await renderUserList();

      await selectRow(user, GUEST);
      await user.click(deleteButton());

      expect(await screen.findByText("Cannot remove")).toBeVisible();
      expect(screen.getByText(GUEST.email)).toBeVisible();
    });
  });
});
