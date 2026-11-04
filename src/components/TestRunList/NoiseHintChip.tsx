import { Chip } from "@mui/material";
import BlurOnIcon from "@mui/icons-material/BlurOn";
import { isNoiseResult, noiseHintOf } from "../../_helpers/noiseHint.helper";
import { SHORT_LIMITATION, stagesText } from "../../_helpers/noiseText.helper";
import { hintColor } from "../../theme";
import { Tooltip } from "../Tooltip";
import type { NoiseAnalysisDto, TestRun } from "../../types";

const LABELS = {
  noise: "Likely noise",
  change: "Likely change",
  pending: "analysing…",
} as const;

const tooltipFor = (analysis: NoiseAnalysisDto): string =>
  `Rendering-noise check. ${stagesText(analysis)}. ${SHORT_LIMITATION}`;

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
  if (!isNoiseResult(analysis)) {
    return chip;
  }
  return <Tooltip title={tooltipFor(analysis)}>{chip}</Tooltip>;
};
