import { Chip, Tooltip } from "@mui/material";
import BlurOnIcon from "@mui/icons-material/BlurOn";
import { noiseHintOf } from "../../_helpers/noiseHint.helper";
import { hintColor } from "../../theme";
import type { NoiseAnalysisDto, NoiseVerdict, TestRun } from "../../types";

const LABELS = {
  noise: "Likely noise",
  change: "Likely change",
  pending: "analysing…",
} as const;

const LIMITATION =
  "A hint, not a decision — it can call a one-digit or faint-border change noise";

const VERDICT_TEXT: Record<NoiseVerdict, string> = {
  noise: "likely noise",
  change: "likely change",
  unknown: "no verdict",
};

const stage = (verdict: NoiseVerdict, score: number) =>
  `${VERDICT_TEXT[verdict]} (${score.toFixed(2)})`;

function tooltipFor({ blur, dinov2 }: NoiseAnalysisDto): string {
  const blurText = blur ? stage(blur.verdict, blur.score) : "no verdict";
  let stages = `Blur only: ${blurText}`;
  if (dinov2 && "error" in dinov2) {
    stages = `Blur: ${blurText} · DINOv2: did not answer`;
  } else if (dinov2 && "verdict" in dinov2) {
    stages = `Blur: ${blurText} · DINOv2: ${stage(dinov2.verdict, dinov2.score)}`;
  }
  return `Rendering-noise check. ${stages}. ${LIMITATION}`;
}

export const NoiseHintChip = ({
  run,
}: {
  run: Pick<TestRun, "status" | "noiseAnalysis">;
}) => {
  const hint = noiseHintOf(run);
  if (!hint) {
    return null;
  }

  const chip = (
    <Chip
      data-testid="noise-hint-chip"
      variant="outlined"
      size="small"
      color={hintColor(hint)}
      label={LABELS[hint]}
      icon={
        hint === "noise" ? <BlurOnIcon data-testid="BlurOnIcon" /> : undefined
      }
      sx={hint === "pending" ? { borderStyle: "dashed" } : undefined}
    />
  );

  const analysis = run.noiseAnalysis;
  if (!analysis || !("version" in analysis)) {
    return chip;
  }
  return <Tooltip title={tooltipFor(analysis)}>{chip}</Tooltip>;
};
