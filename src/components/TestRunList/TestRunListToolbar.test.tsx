import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { toolbarProps } from "../../_test/testRunListFixture";
import { run } from "../../_helpers/testRun.fixture";
import { TestStatus } from "../../types";
import { TestRunListToolbar } from "./TestRunListToolbar";

const unresolved = (id: string) =>
  run({ id, name: id, status: TestStatus.unresolved });

describe("TestRunListToolbar", () => {
  it.each(["table", "grid"] as const)(
    "offers the noise analysis of the listed runs in the %s view",
    (view) => {
      renderWithProviders(
        <TestRunListToolbar
          {...toolbarProps(view)}
          noiseHintAvailable
          rows={[unresolved("a"), unresolved("b")]}
        />,
      );

      expect(screen.getByTestId("analyse-noise-button")).toHaveTextContent(
        "Analyse unresolved (2)",
      );
    },
  );

  it("leaves the analysis out when the project has none", () => {
    renderWithProviders(
      <TestRunListToolbar
        {...toolbarProps("table")}
        noiseHintAvailable={false}
        rows={[unresolved("a")]}
      />,
    );

    expect(
      screen.queryByTestId("analyse-noise-button"),
    ).not.toBeInTheDocument();
  });
});
