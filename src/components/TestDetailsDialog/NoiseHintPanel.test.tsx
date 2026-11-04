import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
} from "../../_test/test.data.helper";
import { testRunService } from "../../services";
import { withRegions } from "../../_test/noiseRegions";
import type { HintStage } from "../../_helpers/noiseRegions.helper";
import { NoiseHintPanel } from "./NoiseHintPanel";

type Props = Parameters<typeof NoiseHintPanel>[0];

const CHANGE = withRegions(NOISE_ANALYSIS_CHANGE);

const renderPanel = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    runId: "run",
    analysis: null,
    stage: null,
    onStageChange: vi.fn(),
    ...overrides,
  };
  const rendered = renderWithProviders(<NoiseHintPanel {...props} />);
  return {
    ...rendered,
    props,
    show: (next: Partial<Props>) =>
      rendered.rerender(<NoiseHintPanel {...props} {...next} />),
  };
};

const panel = () => screen.getByTestId("noise-hint-panel");
const analyseButton = () => screen.getByTestId("analyse-noise-run-button");
const blurToggle = () => screen.getByTestId("hint-areas-blur");
const dinov2Toggle = () => screen.getByTestId("hint-areas-dinov2");

describe("NoiseHintPanel", () => {
  describe("without a result", () => {
    it.each([
      ["no analysis", null],
      [
        "an analysis of a foreign version",
        { ...NOISE_ANALYSIS_NOISE, version: 2 },
      ],
    ])("says the check was not run for %s", (_, analysis) => {
      renderPanel({ analysis });

      expect(
        within(panel()).getByText("Rendering-noise check: not run"),
      ).toBeVisible();
      expect(analyseButton()).toHaveTextContent("Analyse");
      expect(analyseButton()).toHaveAccessibleName("Analyse");
    });

    it("asks to analyse exactly this run and then shows analysing until the result arrives", async () => {
      const analyse = vi
        .spyOn(testRunService, "analyseNoise")
        .mockResolvedValue({ queued: 1, skipped: [] });
      const { user, show } = renderPanel({ runId: "r1" });

      await user.click(analyseButton());

      expect(analyse).toHaveBeenCalledExactlyOnceWith(["r1"]);
      expect(within(panel()).getByText("analysing…")).toBeVisible();
      expect(screen.queryByTestId("analyse-noise-run-button")).toBeNull();

      show({ analysis: NOISE_ANALYSIS_PENDING });
      expect(within(panel()).getByText("analysing…")).toBeVisible();

      show({ analysis: CHANGE });
      expect(within(panel()).queryByText("analysing…")).toBeNull();
      expect(
        within(panel()).getByText("Rendering-noise check: likely change"),
      ).toBeVisible();
    });

    it("offers Analyse again when the backend clears the pending marker", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 1,
        skipped: [],
      });
      const { user, show } = renderPanel();

      await user.click(analyseButton());
      show({ analysis: NOISE_ANALYSIS_PENDING });
      show({ analysis: null });

      expect(within(panel()).queryByText("analysing…")).toBeNull();
      expect(analyseButton()).toHaveTextContent("Analyse");
    });

    it("shows analysing for a pending run without a click", () => {
      renderPanel({ analysis: NOISE_ANALYSIS_PENDING });

      expect(within(panel()).getByText("analysing…")).toBeVisible();
      expect(screen.queryByTestId("analyse-noise-run-button")).toBeNull();
    });

    it("explains why nothing was queued and lets the user try again", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 0,
        skipped: [{ id: "run", reason: "queue full" }],
      });
      const { user } = renderPanel();

      await user.click(analyseButton());

      expect(
        await screen.findByText("Queue is full, try again in a minute"),
      ).toBeVisible();
      expect(analyseButton()).toBeEnabled();
    });

    it("shows the error and lets the user try again when the request fails", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockRejectedValue("No access");
      const { user } = renderPanel();

      await user.click(analyseButton());

      expect(await screen.findByText("No access")).toBeVisible();
      expect(analyseButton()).toBeEnabled();
    });
  });

  describe("with a result", () => {
    it("shows the verdict, both stages and the limitation", () => {
      renderPanel({ analysis: CHANGE });

      const view = within(panel());
      expect(
        view.getByText("Rendering-noise check: likely change"),
      ).toBeVisible();
      expect(view.getByText("· score 0.77")).toBeVisible();
      expect(
        view.getByText(
          "Blur: likely noise (0.39) · DINOv2: likely change (0.77) —",
        ),
      ).toBeVisible();
      expect(
        view.getByText(
          "A hint, not a decision. It can call a small real change noise — a single digit, a dot, a faint border. Look at the highlighted areas before approving.",
        ),
      ).toBeVisible();
      expect(analyseButton()).toHaveTextContent("Analyse again");
    });

    it("says likely noise for a noise verdict", () => {
      renderPanel({ analysis: withRegions(NOISE_ANALYSIS_NOISE) });

      expect(
        within(panel()).getByText("Rendering-noise check: likely noise"),
      ).toBeVisible();
      expect(within(panel()).getByText("· score 0.39")).toBeVisible();
    });

    it("asks to analyse again and shows analysing until the result is renewed", async () => {
      const analyse = vi
        .spyOn(testRunService, "analyseNoise")
        .mockResolvedValue({ queued: 1, skipped: [] });
      const { user, show } = renderPanel({ runId: "r2", analysis: CHANGE });

      await user.click(analyseButton());

      expect(analyse).toHaveBeenCalledExactlyOnceWith(["r2"]);
      expect(within(panel()).getByText("analysing…")).toBeVisible();
      expect(
        within(panel()).queryByText("Rendering-noise check: likely change"),
      ).toBeNull();

      show({
        analysis: { ...CHANGE, computedAt: "2026-11-04T11:00:00Z", score: 0.5 },
      });
      expect(within(panel()).queryByText("analysing…")).toBeNull();
      expect(within(panel()).getByText("· score 0.50")).toBeVisible();
    });

    it("shows the second stage as off in the project", () => {
      renderPanel({
        analysis: withRegions({
          ...NOISE_ANALYSIS_NOISE,
          dinov2: { skipped: "off" },
        }),
      });

      expect(
        within(panel()).getByText(
          "Blur: likely noise (0.39) · DINOv2: off in this project —",
        ),
      ).toBeVisible();
    });

    it("shows the second stage as not needed when blur already sees a change", () => {
      renderPanel({
        analysis: withRegions({
          ...NOISE_ANALYSIS_CHANGE,
          dinov2: { skipped: "blur sees a change" },
        }),
      });

      expect(
        within(panel()).getByText(
          "Blur: likely noise (0.39) · DINOv2: not needed, blur already sees a change —",
        ),
      ).toBeVisible();
    });

    it("shows that the second stage did not answer", () => {
      renderPanel({
        analysis: withRegions({
          ...NOISE_ANALYSIS_CHANGE,
          dinov2: { error: "dinov2 unavailable" },
        }),
      });

      expect(
        within(panel()).getByText(
          "Blur: likely noise (0.39) · DINOv2: did not answer —",
        ),
      ).toBeVisible();
      expect(analyseButton()).toHaveTextContent("Analyse again");
    });

    it("says blur only when there is no second stage", () => {
      renderPanel({
        analysis: withRegions({ ...NOISE_ANALYSIS_NOISE, dinov2: undefined }),
      });

      expect(
        within(panel()).getByText("Blur only: likely noise (0.39) —"),
      ).toBeVisible();
    });

    it.each([
      ["sizes differ", "not available (images differ in size)"],
      ["no diff", "not available (no diff)"],
      ["image too large", "not available (image too large)"],
    ] as const)(
      "shows the reason for an unknown verdict: %s",
      (reason, text) => {
        renderPanel({
          analysis: {
            ...NOISE_ANALYSIS_NOISE,
            verdict: "unknown",
            score: 0,
            reason,
            blur: undefined,
            dinov2: undefined,
          },
        });

        const view = within(panel());
        expect(view.getByText(`Rendering-noise check: ${text}`)).toBeVisible();
        expect(view.queryByText(/score/)).toBeNull();
        expect(view.queryByTestId("hint-areas-blur")).toBeNull();
        expect(analyseButton()).toHaveTextContent("Analyse again");
      },
    );
  });

  describe("area toggles", () => {
    it("pick the stage to show", async () => {
      const { user, props } = renderPanel({ analysis: CHANGE });

      await user.click(blurToggle());
      await user.click(dinov2Toggle());

      expect(props.onStageChange).toHaveBeenNthCalledWith(1, "blur");
      expect(props.onStageChange).toHaveBeenNthCalledWith(2, "dinov2");
    });

    it("show the chosen stage as pressed and clear it when pressed again", async () => {
      const { user, props } = renderPanel({
        analysis: CHANGE,
        stage: "dinov2" as HintStage,
      });

      expect(dinov2Toggle()).toHaveAttribute("aria-pressed", "true");
      expect(blurToggle()).toHaveAttribute("aria-pressed", "false");

      await user.click(dinov2Toggle());

      expect(props.onStageChange).toHaveBeenCalledExactlyOnceWith(null);
    });

    it.each([
      ["a skipped stage", { skipped: "off" as const }],
      ["a stage that failed", { error: "dinov2 unavailable" as const }],
    ])("are disabled for %s", (_, dinov2) => {
      renderPanel({
        analysis: withRegions({ ...NOISE_ANALYSIS_NOISE, dinov2 }),
      });

      expect(blurToggle()).toBeEnabled();
      expect(dinov2Toggle()).toBeDisabled();
    });

    it("are disabled while the regions are not loaded", () => {
      renderPanel({ analysis: NOISE_ANALYSIS_CHANGE });

      expect(blurToggle()).toBeDisabled();
      expect(dinov2Toggle()).toBeDisabled();
    });
  });
});
