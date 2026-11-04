import {
  Box,
  Button,
  Grid,
  Paper,
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

export const NoiseHintPanel = ({
  runId,
  analysis,
  stage,
  onStageChange,
}: NoiseHintPanelProps) => {
  const { enqueueSnackbar } = useDialogSnackbar();
  const { analyse, requesting } = useAnalyseNoise(enqueueSnackbar);

  const result = isNoiseResult(analysis) ? analysis : null;
  const pending = isNoisePending(analysis);
  const analysing = pending || requesting;

  const analyseButton = (label: string) => (
    <Button
      size="small"
      variant="outlined"
      data-testid="analyse-noise-run-button"
      onClick={() => void analyse([runId])}
    >
      {label}
    </Button>
  );

  let body;
  if (analysing) {
    body = <Typography variant="body2">{`${ANALYSING}…`}</Typography>;
  } else if (!result) {
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

  return (
    <Grid size={12}>
      <Paper
        elevation={0}
        data-testid="noise-hint-panel"
        sx={{
          padding: 1.5,
          marginTop: 1,
          backgroundColor: "action.hover",
          borderLeft: "3px solid",
          borderColor: "hint.main",
        }}
      >
        {body}
      </Paper>
    </Grid>
  );
};
