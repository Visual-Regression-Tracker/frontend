import { useEffect } from "react";
import { act, screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { run } from "../../_helpers/testRun.fixture";
import {
  updateTestRun,
  useTestRunDispatch,
  useTestRunState,
} from "../../contexts";
import { type TestRun, TestStatus } from "../../types";
import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
} from "../../_test/test.data.helper";
import { testRunService } from "../../services";
import { withRegions } from "../../_test/noiseRegions";
import { isNoisePending } from "../../_helpers/noiseHint.helper";
import type { HintStage } from "../../_helpers/noiseRegions.helper";
import { NoiseHintPanel } from "./NoiseHintPanel";

type Props = Parameters<typeof NoiseHintPanel>[0];

const CHANGE = withRegions(NOISE_ANALYSIS_CHANGE);

const renderPanel = async (overrides: Partial<Props> = {}) => {
  const props: Props = {
    runId: "run",
    analysis: null,
    stage: null,
    onStageChange: vi.fn(),
    ...overrides,
  };
  const rendered = renderWithProviders(<NoiseHintPanel {...props} />);
  if (!isNoisePending(props.analysis)) {
    await rendered.user.click(chip());
  }
  return {
    ...rendered,
    props,
    show: (next: Partial<Props>) =>
      rendered.rerender(<NoiseHintPanel {...props} {...next} />),
  };
};

type Dispatch = ReturnType<typeof useTestRunDispatch>;

const ConnectedPanel = ({
  onDispatch,
}: {
  onDispatch: (dispatch: Dispatch) => void;
}) => {
  const dispatch = useTestRunDispatch();
  const { selectedTestRun } = useTestRunState();
  useEffect(() => {
    onDispatch(dispatch);
  }, [dispatch, onDispatch]);
  if (!selectedTestRun) {
    return null;
  }
  return (
    <NoiseHintPanel
      runId={selectedTestRun.id}
      analysis={selectedTestRun.noiseAnalysis ?? null}
      stage={null}
      onStageChange={vi.fn()}
    />
  );
};

const renderConnected = async (
  id: string,
  noiseAnalysis: TestRun["noiseAnalysis"],
) => {
  const initial = run({
    id,
    name: id,
    status: TestStatus.unresolved,
    noiseAnalysis,
  });
  vi.spyOn(testRunService, "getDetails").mockResolvedValue(initial);
  let dispatch!: Dispatch;
  const rendered = renderWithProviders(
    <ConnectedPanel
      onDispatch={(next) => {
        dispatch = next;
      }}
    />,
    { route: `/?testId=${id}` },
  );
  await rendered.user.click(
    await screen.findByTestId("noise-hint-popover-chip"),
  );
  await screen.findByTestId("noise-hint-panel");
  return {
    ...rendered,
    show: (next: TestRun["noiseAnalysis"]) =>
      act(() => {
        updateTestRun(dispatch, [{ ...initial, noiseAnalysis: next }]);
      }),
  };
};

const chip = () => screen.getByTestId("noise-hint-popover-chip");
const panel = () => screen.getByTestId("noise-hint-panel");
const analyseButton = () => screen.getByTestId("analyse-noise-run-button");
const blurToggle = () => screen.getByTestId("hint-areas-blur");
const dinov2Toggle = () => screen.getByTestId("hint-areas-dinov2");

describe("NoiseHintPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("chip", () => {
    const UNKNOWN = {
      ...NOISE_ANALYSIS_NOISE,
      verdict: "unknown" as const,
      score: 0,
      reason: "sizes differ" as const,
    };

    it.each([
      ["no analysis", null, "≋ Not analysed ▾"],
      ["a noise verdict", NOISE_ANALYSIS_NOISE, "≋ Likely noise · 0.39 ▾"],
      ["a change verdict", NOISE_ANALYSIS_CHANGE, "≋ Likely change · 0.77 ▾"],
      ["an unknown verdict", UNKNOWN, "≋ Can't tell ▾"],
      ["a pending run", NOISE_ANALYSIS_PENDING, "≋ Analysing…"],
    ])("reads %s", async (_, analysis, label) => {
      await renderPanel({ analysis });

      expect(chip()).toHaveTextContent(label);
    });

    it("does not open the panel for a pending run", async () => {
      const { user } = await renderPanel({ analysis: NOISE_ANALYSIS_PENDING });

      await user.click(chip());

      expect(screen.queryByTestId("noise-hint-panel")).toBeNull();
    });
  });

  describe("popover", () => {
    it("is not modal, so the canvas behind it stays usable", async () => {
      await renderPanel({ analysis: null });

      expect(document.querySelector(".MuiBackdrop-root")).toBeNull();
      expect(
        screen.getByRole("dialog", { name: "Rendering-noise check" }),
      ).toContainElement(panel());
    });

    it("closes on Escape", async () => {
      const { user } = await renderPanel({ analysis: null });

      await user.keyboard("{Escape}");

      expect(screen.queryByTestId("noise-hint-panel")).toBeNull();
    });

    it("closes on a click outside", async () => {
      const { user } = await renderPanel({ analysis: null });

      await user.click(document.body);

      expect(screen.queryByTestId("noise-hint-panel")).toBeNull();
    });

    it("closes when the chip is clicked again", async () => {
      const { user } = await renderPanel({ analysis: null });

      await user.click(chip());

      expect(screen.queryByTestId("noise-hint-panel")).toBeNull();
    });
  });

  describe("without a result", () => {
    it.each([
      ["no analysis", null],
      [
        "an analysis of a foreign version",
        { ...NOISE_ANALYSIS_NOISE, version: 2 },
      ],
    ])("says the check was not run for %s", async (_, analysis) => {
      await renderPanel({ analysis });

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
      const { user, show } = await renderConnected("r1", null);

      await user.click(analyseButton());

      expect(analyse).toHaveBeenCalledExactlyOnceWith(["r1"]);
      expect(chip()).toHaveTextContent("Analysing…");
      expect(screen.queryByTestId("analyse-noise-run-button")).toBeNull();

      show(NOISE_ANALYSIS_PENDING);
      expect(chip()).toHaveTextContent("Analysing…");

      show(NOISE_ANALYSIS_CHANGE);
      expect(chip()).not.toHaveTextContent("Analysing…");
      await user.click(chip());
      expect(
        within(panel()).getByText("Rendering-noise check: likely change"),
      ).toBeVisible();
    });

    it("offers Analyse again when the backend clears the pending marker", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 1,
        skipped: [],
      });
      const { user, show } = await renderConnected("r1", null);

      await user.click(analyseButton());
      show(NOISE_ANALYSIS_PENDING);
      show(null);

      expect(chip()).toHaveTextContent("Not analysed");
      await user.click(chip());
      expect(analyseButton()).toHaveTextContent("Analyse");
    });

    it("shows analysing for a pending run without a click", async () => {
      await renderPanel({ analysis: NOISE_ANALYSIS_PENDING });

      expect(chip()).toHaveTextContent("Analysing…");
      expect(screen.queryByTestId("noise-hint-panel")).toBeNull();
    });

    it("explains why nothing was queued and lets the user try again", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockResolvedValue({
        queued: 0,
        skipped: [{ id: "run", reason: "queue full" }],
      });
      const { user } = await renderPanel();

      await user.click(analyseButton());

      expect(
        await screen.findByText("Queue is full, try again in a minute"),
      ).toBeVisible();
      await user.click(chip());
      expect(analyseButton()).toBeEnabled();
    });

    it("shows the error and lets the user try again when the request fails", async () => {
      vi.spyOn(testRunService, "analyseNoise").mockRejectedValue("No access");
      const { user } = await renderPanel();

      await user.click(analyseButton());

      expect(await screen.findByText("No access")).toBeVisible();
      await user.click(chip());
      expect(analyseButton()).toBeEnabled();
    });
  });

  describe("with a result", () => {
    it("shows the verdict, both stages and the limitation", async () => {
      await renderPanel({ analysis: CHANGE });

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

    it("keeps the Analyse again label on one line", async () => {
      await renderPanel({ analysis: CHANGE });

      expect(analyseButton()).toHaveStyle({ whiteSpace: "nowrap" });
    });

    it("says likely noise for a noise verdict", async () => {
      await renderPanel({ analysis: withRegions(NOISE_ANALYSIS_NOISE) });

      expect(
        within(panel()).getByText("Rendering-noise check: likely noise"),
      ).toBeVisible();
      expect(within(panel()).getByText("· score 0.39")).toBeVisible();
    });

    it("asks to analyse again and shows analysing until the result is renewed", async () => {
      const analyse = vi
        .spyOn(testRunService, "analyseNoise")
        .mockResolvedValue({ queued: 1, skipped: [] });
      const { user, show } = await renderConnected("r2", NOISE_ANALYSIS_CHANGE);

      await user.click(analyseButton());

      expect(analyse).toHaveBeenCalledExactlyOnceWith(["r2"]);
      expect(chip()).toHaveTextContent("Analysing…");
      expect(screen.queryByTestId("noise-hint-panel")).toBeNull();

      show({
        ...NOISE_ANALYSIS_CHANGE,
        computedAt: "2026-11-04T11:00:00Z",
        score: 0.5,
      });
      await user.click(chip());
      expect(within(panel()).getByText("· score 0.50")).toBeVisible();
    });

    it("shows the second stage as off in the project", async () => {
      await renderPanel({
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

    it("shows the second stage as not needed when blur already sees a change", async () => {
      await renderPanel({
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

    it("shows that the second stage did not answer", async () => {
      await renderPanel({
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

    it("says blur only when there is no second stage", async () => {
      await renderPanel({
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
      async (reason, text) => {
        await renderPanel({
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
      const { user, props } = await renderPanel({ analysis: CHANGE });

      await user.click(blurToggle());
      await user.click(dinov2Toggle());

      expect(props.onStageChange).toHaveBeenNthCalledWith(1, "blur");
      expect(props.onStageChange).toHaveBeenNthCalledWith(2, "dinov2");
    });

    it("show the chosen stage as pressed and clear it when pressed again", async () => {
      const { user, props } = await renderPanel({
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
    ])("are disabled for %s", async (_, dinov2) => {
      await renderPanel({
        analysis: withRegions({ ...NOISE_ANALYSIS_NOISE, dinov2 }),
      });

      expect(blurToggle()).toBeEnabled();
      expect(dinov2Toggle()).toBeDisabled();
    });

    it("are disabled while the regions are not loaded", async () => {
      await renderPanel({ analysis: NOISE_ANALYSIS_CHANGE });

      expect(blurToggle()).toBeDisabled();
      expect(dinov2Toggle()).toBeDisabled();
    });
  });
});
