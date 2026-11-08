import { screen } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { CommentIndicator } from "./CommentIndicator";

describe("CommentIndicator", () => {
  it("shows an icon that carries the comment text in its tooltip", async () => {
    const { user } = renderWithProviders(
      <CommentIndicator text="Footer is cut off" />,
    );

    await user.hover(screen.getByRole("img", { name: "Has a comment" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Footer is cut off",
    );
  });

  it("opens the tooltip from the keyboard and describes the icon with the text", async () => {
    const { user } = renderWithProviders(
      <CommentIndicator text="Footer is cut off" />,
    );

    await user.tab();

    const icon = screen.getByRole("img", { name: "Has a comment" });
    expect(icon).toHaveFocus();
    expect(icon).toHaveAccessibleDescription("Footer is cut off");
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Footer is cut off",
    );
  });

  it("leaves the tab order to the caller when given a tabIndex", () => {
    renderWithProviders(<CommentIndicator text="Note" tabIndex={-1} />);

    expect(screen.getByRole("img", { name: "Has a comment" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it.each([undefined, null, "", "   "])("shows nothing for %j", (text) => {
    renderWithProviders(<CommentIndicator text={text} />);

    expect(screen.queryByTestId("comment-indicator")).not.toBeInTheDocument();
  });
});
