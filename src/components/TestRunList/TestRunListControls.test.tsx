import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestRunListControls } from "./TestRunListControls";

const renderControls = (
  overrides: Partial<Parameters<typeof TestRunListControls>[0]> = {},
) => {
  const props = {
    view: "table" as const,
    onViewChange: vi.fn(),
    density: "standard" as const,
    onDensityChange: vi.fn(),
    grouped: false,
    onGroupedChange: vi.fn(),
    groupByAxis: "customTags" as const,
    diffToggle: { checked: true, onChange: vi.fn() },
    ...overrides,
  };
  render(<TestRunListControls {...props} />);
  return { props, user: userEvent.setup() };
};

const openMenu = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "View" }));

describe("TestRunListControls", () => {
  it("reports the picked density and closes the menu", async () => {
    const { props, user } = renderControls();

    await openMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: "Compact" }));

    expect(props.onDensityChange).toHaveBeenCalledWith("compact");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("names the grouping axis and reports the grouping", async () => {
    const { props, user } = renderControls();

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitemradio", { name: "Variation (customTags)" }),
    );

    expect(props.onGroupedChange).toHaveBeenCalledWith(true);
  });

  it("marks the current density and grouping", async () => {
    const { user } = renderControls({ density: "compact", grouped: true });

    await openMenu(user);

    expect(
      screen.getByRole("menuitemradio", { name: "Compact" }),
    ).toBeChecked();
    expect(
      screen.getByRole("menuitemradio", { name: "None" }),
    ).not.toBeChecked();
  });

  it("toggles the diff from the menu", async () => {
    const { props, user } = renderControls();

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: /Show diff in grid/ }),
    );

    expect(props.diffToggle.onChange).toHaveBeenCalledWith(false);
  });

  it("shows the diff switch in the toolbar only for the grid", () => {
    renderControls({ view: "grid" });

    expect(screen.getByLabelText("Show diff")).toBeChecked();
  });

  it("reports the picked view", async () => {
    const { props, user } = renderControls();

    await user.click(screen.getByRole("button", { name: "Grid view" }));

    expect(props.onViewChange).toHaveBeenCalledWith("grid");
  });
});
