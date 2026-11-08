import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { buildResult } from "../_test/statistics.fixture";
import { TestStatus } from "../types";
import { ResultsChart } from "./ResultsChart";

describe("ResultsChart", () => {
  it("names each bar with its build and counts per status", () => {
    renderWithProviders(
      <ResultsChart
        projectId="p1"
        builds={[buildResult(7, { ok: 4, failed: 1 }), buildResult(8)]}
      />,
    );

    const bars = within(
      screen.getByRole("list", { name: "Results per build" }),
    ).getAllByRole("link");
    expect(bars[0]).toHaveAccessibleName(
      "Build #7: 5 runs (4 passed, 1 failed)",
    );
    expect(bars[1]).toHaveAccessibleName("Build #8: 0 runs");
  });

  it("opens the build on the Builds tab", () => {
    renderWithProviders(
      <ResultsChart projectId="p1" builds={[buildResult(7, { ok: 1 })]} />,
    );

    expect(screen.getByRole("link", { name: /Build #7/ })).toHaveAttribute(
      "href",
      "/p1?buildId=build-7",
    );
  });

  it("scales segments against the tallest build", () => {
    renderWithProviders(
      <ResultsChart
        projectId="p1"
        builds={[buildResult(1, { ok: 10 }), buildResult(2, { ok: 5 })]}
      />,
    );

    const [tall, short] = screen.getAllByTestId("segment-ok");
    expect(tall).toHaveStyle({ height: "100%" });
    expect(short).toHaveStyle({ height: "50%" });
  });

  it("draws segments only for statuses a build has", () => {
    renderWithProviders(
      <ResultsChart
        projectId="p1"
        builds={[buildResult(1, { unresolved: 2 })]}
      />,
    );

    expect(screen.getAllByTestId("segment-unresolved")).toHaveLength(1);
    expect(screen.queryByTestId("segment-ok")).toBeNull();
  });

  it("lists every status in the legend", () => {
    renderWithProviders(
      <ResultsChart projectId="p1" builds={[buildResult(1)]} />,
    );

    const labels = {
      [TestStatus.ok]: "Passed",
      [TestStatus.approved]: "Approved",
      [TestStatus.autoApproved]: "Auto-approved",
      [TestStatus.new]: "New",
      [TestStatus.unresolved]: "Unresolved",
      [TestStatus.failed]: "Failed",
    };
    for (const [status, label] of Object.entries(labels)) {
      expect(screen.getByTestId(`legend-${status}`)).toHaveTextContent(
        new RegExp(`^${label}$`),
      );
    }
  });

  it("shows build numbers under the bars only while there are few", () => {
    const { unmount } = renderWithProviders(
      <ResultsChart projectId="p1" builds={[buildResult(3, { ok: 1 })]} />,
    );
    expect(screen.getByText("3")).toBeVisible();
    unmount();

    const many = Array.from({ length: 21 }, (_, i) =>
      buildResult(i + 100, { ok: 1 }),
    );
    renderWithProviders(<ResultsChart projectId="p1" builds={many} />);
    expect(screen.queryByText("100")).toBeNull();
  });
});
