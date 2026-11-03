import { screen, within } from "@testing-library/react";
import { DataGrid } from "@mui/x-data-grid";
import { renderWithProviders } from "../../_test/render";
import { UserListToolbar } from "./UserListToolbar";

const renderGrid = () =>
  renderWithProviders(
    <DataGrid
      rows={[{ id: "1", email: "ada@email.com" }]}
      columns={[{ field: "email", headerName: "Email" }]}
      showToolbar
      slots={{ toolbar: UserListToolbar }}
    />,
  );

const gridRoot = () =>
  screen.getByRole("grid").closest<HTMLElement>(".MuiDataGrid-root");

describe("UserListToolbar", () => {
  it("makes the rows compact from the density menu", async () => {
    const { user } = renderGrid();

    await user.click(screen.getByRole("button", { name: "Density" }));
    await user.click(screen.getByRole("menuitem", { name: "Compact" }));

    expect(gridRoot()).toHaveClass("MuiDataGrid-root--densityCompact");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("marks the density in use", async () => {
    const { user } = renderGrid();

    await user.click(screen.getByRole("button", { name: "Density" }));

    expect(
      within(screen.getByRole("menu", { name: "Density" })).getByRole(
        "menuitem",
        {
          name: "Standard",
        },
      ),
    ).toHaveClass("Mui-selected");
  });

  it("opens the filter panel", async () => {
    const { user } = renderGrid();

    await user.click(screen.getByRole("button", { name: "Filters" }));

    expect(await screen.findByLabelText("Operator")).toBeInTheDocument();
  });
});
