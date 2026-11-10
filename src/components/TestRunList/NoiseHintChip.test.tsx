import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import {
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
  TEST_UNRESOLVED,
  TEST_UNRESOLVED_CHANGE,
  TEST_UNRESOLVED_PENDING,
} from "../../_test/test.data.helper";
import { LIMITATION } from "../../_helpers/noiseText.helper";
import { TestRun } from "../../types";
import { TestStatus } from "../../types/testStatus";
import { NoiseHintChip } from "./NoiseHintChip";

const withAnalysis = (noiseAnalysis: unknown, status = TestStatus.unresolved) =>
  ({ ...TEST_UNRESOLVED, status, noiseAnalysis }) as TestRun;

const chip = () => screen.getByTestId("noise-hint-chip");

describe("NoiseHintChip", () => {
  it("says a noise result is likely noise, with the blur icon and the score in the tooltip", () => {
    renderWithProviders(<NoiseHintChip run={TEST_UNRESOLVED} />);

    expect(chip()).toHaveTextContent("Likely noise");
    expect(screen.getByTestId("BlurOnIcon")).toBeInTheDocument();
    expect(chip()).toHaveAttribute(
      "aria-label",
      `Rendering-noise check, score 0.39. ${LIMITATION}`,
    );
  });

  it("says a change result is likely change, without the blur icon", () => {
    renderWithProviders(<NoiseHintChip run={TEST_UNRESOLVED_CHANGE} />);

    expect(chip()).toHaveTextContent("Likely change");
    expect(screen.queryByTestId("BlurOnIcon")).not.toBeInTheDocument();
    expect(chip()).toHaveAttribute(
      "aria-label",
      `Rendering-noise check, score 0.77. ${LIMITATION}`,
    );
  });

  it("shows analysing while the analysis is pending", () => {
    renderWithProviders(<NoiseHintChip run={TEST_UNRESOLVED_PENDING} />);

    expect(chip()).toHaveTextContent("Analysing…");
    expect(chip()).toHaveStyle({ borderStyle: "dashed" });
  });

  it("rounds the score to two decimals", () => {
    renderWithProviders(
      <NoiseHintChip
        run={withAnalysis({ ...NOISE_ANALYSIS_NOISE, score: 0.4 })}
      />,
    );

    expect(chip().getAttribute("aria-label")).toContain("score 0.40.");
  });

  it.each([
    [
      "an approved run with a result",
      withAnalysis(NOISE_ANALYSIS_NOISE, TestStatus.approved),
    ],
    ["a run without a result", withAnalysis(null)],
    [
      "a run whose result has a foreign version",
      withAnalysis({ ...NOISE_ANALYSIS_NOISE, version: 2 }),
    ],
    [
      "an unknown verdict",
      withAnalysis({
        ...NOISE_ANALYSIS_NOISE,
        verdict: "unknown",
        reason: "no diff",
      }),
    ],
    [
      "a verdict it does not know",
      withAnalysis({ ...NOISE_ANALYSIS_NOISE, verdict: "maybe" }),
    ],
    [
      "a pending flag that is not true",
      withAnalysis({ pending: false, requestedAt: "x" }),
    ],
    [
      "an approved run still pending",
      withAnalysis(NOISE_ANALYSIS_PENDING, TestStatus.approved),
    ],
  ])("shows no chip for %s", (_, run) => {
    renderWithProviders(<NoiseHintChip run={run} />);

    expect(screen.queryByTestId("noise-hint-chip")).not.toBeInTheDocument();
  });
});
