import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestRunListControls } from "./TestRunListControls";

describe("TestRunListControls", () => {
  it("reports the picked view", async () => {
    const onViewChange = vi.fn();
    render(<TestRunListControls view="table" onViewChange={onViewChange} />);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Grid view" }));

    expect(onViewChange).toHaveBeenCalledWith("grid");
  });

  it("offers only the view toggle, no view menu or diff switch", () => {
    render(<TestRunListControls view="grid" onViewChange={vi.fn()} />);

    expect(screen.getAllByRole("button").map((b) => b.ariaLabel)).toEqual([
      "Table view",
      "Grid view",
    ]);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});
