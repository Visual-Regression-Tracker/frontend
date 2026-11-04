import { useState } from "react";
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
import { testRunService } from "../../services";
import type {
  NoiseAnalysisDto,
  NoiseAnalysisSkip,
  NoiseVerdict,
} from "../../types";
import { useDialogSnackbar } from "./useDialogSnackbar";

interface NoiseHintPanelProps {
  runId: string;
  analysis: NoiseAnalysisValue;
  stage: HintStage | null;
  onStageChange: (stage: HintStage | null) => void;
}

const VERDICT_TEXT: Record<NoiseVerdict, string> = {
  noise: "likely noise",
  change: "likely change",
  unknown: "no verdict",
};

const LIMITATION =
  "A hint, not a decision. It can call a small real change noise — a single digit, a dot, a faint border. Look at the highlighted areas before approving.";

const UNKNOWN_REASON: Record<string, string> = {
  "sizes differ": "images differ in size",
};

const stageText = (verdict: NoiseVerdict, score: number) =>
  `${VERDICT_TEXT[verdict]} (${score.toFixed(2)})`;

function stagesText({ blur, dinov2 }: NoiseAnalysisDto): string {
  const blurText = blur ? stageText(blur.verdict, blur.score) : "no verdict";
  if (!dinov2) {
    return `Blur only: ${blurText}`;
  }
  let dinov2Text: string;
  if ("error" in dinov2) {
    dinov2Text = "did not answer";
  } else if ("skipped" in dinov2) {
    dinov2Text =
      dinov2.skipped === "off"
        ? "off in this project"
        : "not needed, blur already sees a change";
  } else {
    dinov2Text = stageText(dinov2.verdict, dinov2.score);
  }
  return `Blur: ${blurText} · DINOv2: ${dinov2Text}`;
}

function headline({ verdict, reason }: NoiseAnalysisDto): string {
  if (verdict !== "unknown") {
    return `Rendering-noise check: ${VERDICT_TEXT[verdict]}`;
  }
  const why = reason ? ` (${UNKNOWN_REASON[reason] ?? reason})` : "";
  return `Rendering-noise check: not available${why}`;
}

const skipMessage = ({ reason }: NoiseAnalysisSkip) =>
  reason === "queue full"
    ? "Queue is full, try again in a minute"
    : `Not analysed: ${reason}`;

const computedAtOf = (analysis: NoiseHintPanelProps["analysis"]) =>
  analysis && "computedAt" in analysis ? analysis.computedAt : null;

export const NoiseHintPanel = ({
  runId,
  analysis,
  stage,
  onStageChange,
}: NoiseHintPanelProps) => {
  const { enqueueSnackbar } = useDialogSnackbar();
  const [waitingFor, setWaitingFor] = useState<{ computedAt: string | null }>();

  const result = isNoiseResult(analysis) ? analysis : null;
  const analysing =
    isNoisePending(analysis) ||
    (!!waitingFor && waitingFor.computedAt === computedAtOf(analysis));

  const analyse = () => {
    setWaitingFor({ computedAt: computedAtOf(analysis) });
    testRunService
      .analyseNoise([runId])
      .then(({ skipped }) => {
        if (skipped.length > 0) {
          setWaitingFor(undefined);
          enqueueSnackbar(skipMessage(skipped[0]), { variant: "warning" });
        }
      })
      .catch((err: string) => {
        setWaitingFor(undefined);
        enqueueSnackbar(err, { variant: "error" });
      });
  };

  const analyseButton = (label: string) => (
    <Button
      size="small"
      variant="outlined"
      data-testid="analyse-noise-run-button"
      onClick={analyse}
    >
      {label}
    </Button>
  );

  let body;
  if (analysing) {
    body = <Typography variant="body2">analysing…</Typography>;
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
