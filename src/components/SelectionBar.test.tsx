import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectionBar } from "./SelectionBar";

const setup = (selected: number, total = 10) => {
  const onSelectAll = vi.fn();
  const onClose = vi.fn();
  const onDelete = vi.fn();
  render(
    <SelectionBar
      selected={selected}
      total={total}
      onSelectAll={onSelectAll}
      onClose={onClose}
      actions={[{ label: "Delete", color: "error", onClick: onDelete }]}
    />,
  );
  return { onSelectAll, onClose, onDelete };
};

describe("SelectionBar", () => {
  it("shows how many are selected and offers to select all", async () => {
    const { onSelectAll } = setup(3);

    expect(screen.getByText("3 selected")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Select all 10" }),
    );

    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });

  it("hides Select all when everything is selected", () => {
    setup(10);

    expect(screen.queryByRole("button", { name: /Select all/ })).toBeNull();
  });

  it("runs an action", async () => {
    const { onDelete } = setup(2);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("closes", async () => {
    const { onClose } = setup(2);

    await userEvent.click(
      screen.getByRole("button", { name: "Clear selection" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
