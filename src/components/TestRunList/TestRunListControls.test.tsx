import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestRunListControls } from "./TestRunListControls";

const renderControls = (
  overrides: Partial<Parameters<typeof TestRunListControls>[0]> = {},
) => {
  const props = {
    view: "table" as const,
    onViewChange: vi.fn(),
    grouped: false,
    onGroupedChange: vi.fn(),
    groupByAxis: "customTags" as const,
    ...overrides,
  };
  render(<TestRunListControls {...props} />);
  return { props, user: userEvent.setup() };
};

const groupSwitch = () =>
  screen.getByRole("switch", { name: "Group variations" });

describe("TestRunListControls", () => {
  it("reports the picked view", async () => {
    const { props, user } = renderControls();

    await user.click(screen.getByRole("button", { name: "Grid view" }));

    expect(props.onViewChange).toHaveBeenCalledWith("grid");
  });

  it("reports grouping switched on", async () => {
    const { props, user } = renderControls();

    await user.click(groupSwitch());

    expect(props.onGroupedChange).toHaveBeenCalledWith(true);
  });

  it("shows grouping as on while it is", () => {
    renderControls({ grouped: true });

    expect(groupSwitch()).toBeChecked();
  });

  it("names the project's axis in the switch's hint", async () => {
    const { user } = renderControls({ view: "grid", groupByAxis: "viewport" });

    await user.hover(groupSwitch());

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "One card per screen, its viewport variations behind it. The axis is set in Settings.",
    );
  });
});
