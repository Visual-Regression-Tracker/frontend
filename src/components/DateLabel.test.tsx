import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { formatDateTime } from "../_helpers/format.helper";
import { DateLabel } from "./DateLabel";

describe("DateLabel", () => {
  it("shows the short date and the full date in a tooltip", async () => {
    const date = new Date(Date.now() - 2 * 3_600_000).toISOString();
    render(<DateLabel date={date} />);

    await userEvent.hover(screen.getByText("2 h ago"));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      formatDateTime(date),
    );
  });
});
