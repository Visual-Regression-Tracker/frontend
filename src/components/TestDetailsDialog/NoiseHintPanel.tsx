import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Popover,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  isNoisePending,
  isNoiseResult,
  type NoiseAnalysisValue,
} from "../../_helpers/noiseHint.helper";
import { type HintStage, regionsOf } from "../../_helpers/noiseRegions.helper";
import {
  ANALYSING,
  LIMITATION,
  stagesText,
  VERDICT_TEXT,
} from "../../_helpers/noiseText.helper";
import type { NoiseAnalysisDto } from "../../types";
import { useAnalyseNoise } from "../../contexts";
import { hintColor } from "../../theme";
import { useDialogSnackbar } from "./useDialogSnackbar";

interface NoiseHintPanelProps {
  runId: string;
  analysis: NoiseAnalysisValue;
  stage: HintStage | null;
  onStageChange: (stage: HintStage | null) => void;
}

const UNKNOWN_REASON: Record<string, string> = {
  "sizes differ": "images differ in size",
};

function headline({ verdict, reason }: NoiseAnalysisDto): string {
  if (verdict !== "unknown") {
    return `Rendering-noise check: ${VERDICT_TEXT[verdict]}`;
  }
  const why = reason ? ` (${UNKNOWN_REASON[reason] ?? reason})` : "";
  return `Rendering-noise check: not available${why}`;
}

function chipView(result: NoiseAnalysisDto | null, analysing: boolean) {
  if (analysing) {
    return { color: hintColor("pending"), label: `${ANALYSING}…` };
  }
  if (!result) {
    return { color: "default", label: "Not analysed ▾" } as const;
  }
  if (result.verdict === "unknown") {
    return { color: "default", label: "Can't tell ▾" } as const;
  }
  const verdict = result.verdict === "noise" ? "Likely noise" : "Likely change";
  return {
    color: hintColor(result.verdict),
    label: `${verdict} · ${result.score.toFixed(2)} ▾`,
  };
}

export const NoiseHintPanel = ({
  runId,
  analysis,
  stage,
  onStageChange,
}: NoiseHintPanelProps) => {
  const { enqueueSnackbar } = useDialogSnackbar();
  const { analyse, requesting } = useAnalyseNoise(enqueueSnackbar);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const result = isNoiseResult(analysis) ? analysis : null;
  const pending = isNoisePending(analysis);
  const analysing = pending || requesting;
  if (analysing && anchor) {
    setAnchor(null);
  }

  const analyseButton = (label: string) => (
    <Button
      size="small"
      variant="outlined"
      data-testid="analyse-noise-run-button"
      onClick={() => {
        setAnchor(null);
        void analyse([runId]);
      }}
    >
      {label}
    </Button>
  );

  let body;
  if (!result) {
    body = (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2">Rendering-noise check: not run</Typography>
        {analyseButton("Analyse")}
      </Box>
    );
  } else {
    const known = result.verdict !== "unknown";
    body = (
      <>
        <Typography variant="body2">
          <strong>{headline(result)}</strong>
          {known && ` · score ${result.score.toFixed(2)}`}
        </Typography>
        {known && (
          <Typography
            variant="caption"
            component="div"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            {`${stagesText(result)} —`}
            <ToggleButtonGroup
              exclusive
              size="small"
              value={stage}
              onChange={(_, next: HintStage | null) => onStageChange(next)}
            >
              <ToggleButton
                value="blur"
                data-testid="hint-areas-blur"
                disabled={regionsOf(result, "blur").length === 0}
              >
                Blur areas
              </ToggleButton>
              <ToggleButton
                value="dinov2"
                data-testid="hint-areas-dinov2"
                disabled={regionsOf(result, "dinov2").length === 0}
              >
                DINOv2 areas
              </ToggleButton>
            </ToggleButtonGroup>
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {known && (
            <Typography variant="caption" color="text.secondary">
              {LIMITATION}
            </Typography>
          )}
          {analyseButton("Analyse again")}
        </Box>
      </>
    );
  }

  const view = chipView(result, analysing);

  return (
    <>
      <Chip
        size="small"
        variant="outlined"
        color={view.color}
        data-testid="noise-hint-popover-chip"
        label={`≋ ${view.label}`}
        onClick={
          analysing ? undefined : (event) => setAnchor(event.currentTarget)
        }
      />
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box data-testid="noise-hint-panel" sx={{ p: 2, maxWidth: 520 }}>
          {body}
        </Box>
      </Popover>
    </>
  );
};
