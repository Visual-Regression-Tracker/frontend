import { screen } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import ProjectStatisticsPage from "./ProjectStatisticsPage";

describe("ProjectStatisticsPage", () => {
  it("says statistics are not available yet", () => {
    renderWithProviders(<ProjectStatisticsPage />);

    expect(screen.getByRole("heading", { name: "Statistics" })).toBeVisible();
    expect(screen.getByText("Statistics are not available yet")).toBeVisible();
  });
});
