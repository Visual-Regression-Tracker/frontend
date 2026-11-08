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

  it.each([undefined, null, "", "   "])("shows nothing for %j", (text) => {
    renderWithProviders(<CommentIndicator text={text} />);

    expect(screen.queryByTestId("comment-indicator")).not.toBeInTheDocument();
  });
});
