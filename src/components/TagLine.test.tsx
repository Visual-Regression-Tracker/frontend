import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagLine } from "./TagLine";

describe("TagLine", () => {
  it("joins the present tags in a fixed order", () => {
    const { container } = render(
      <TagLine
        tags={{
          customTags: "beta",
          os: "macOS",
          browser: "Chrome",
          viewport: "1280x720",
          device: "MacBook",
        }}
      />,
    );

    expect(container).toHaveTextContent(
      "macOS · MacBook · Chrome · 1280x720 · beta",
    );
  });

  it("skips empty tags", () => {
    const { container } = render(
      <TagLine tags={{ os: "macOS", browser: "", device: undefined }} />,
    );

    expect(container).toHaveTextContent(/^macOS$/);
  });

  it("renders nothing without tags", () => {
    const { container } = render(<TagLine tags={{ os: null }} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("names the field in a tooltip", async () => {
    render(<TagLine tags={{ viewport: "1280x720" }} />);

    await userEvent.hover(screen.getByText("1280x720"));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Viewport");
  });
});
