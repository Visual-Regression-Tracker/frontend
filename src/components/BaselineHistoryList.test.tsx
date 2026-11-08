import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { run } from "../_helpers/testRun.fixture";
import type { Baseline } from "../types/baseline";
import { BaselineHistoryList } from "./BaselineHistoryList";

const baseline = (id: string, comment?: string): Baseline => ({
  id,
  baselineName: `${id}.png`,
  testVariationId: "variation",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
  testRun: run({ id: `run-${id}`, comment }),
});

describe("BaselineHistoryList", () => {
  it("marks only the versions whose test run has a comment", () => {
    renderWithProviders(
      <BaselineHistoryList
        baselines={[baseline("b2", "Approved by design"), baseline("b1")]}
        noiseAvailable={false}
        onSelect={vi.fn()}
        onOpenTestRun={vi.fn()}
      />,
    );

    const [commented, plain] = screen.getAllByRole("listitem");
    expect(
      within(commented).getByRole("img", { name: "Has a comment" }),
    ).toBeVisible();
    expect(
      within(plain).queryByTestId("comment-indicator"),
    ).not.toBeInTheDocument();
  });
});
