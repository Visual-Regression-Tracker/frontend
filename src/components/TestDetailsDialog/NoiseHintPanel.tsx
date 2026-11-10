import { type KeyboardEvent, useState } from "react";
import {
  Box,
  Button,
  Chip,
  ClickAwayListener,
  Paper,
  Popper,
  Typography,
} from "@mui/material";
import {
  isNoisePending,
  isNoiseResult,
  type NoiseAnalysisValue,
} from "../../_helpers/noiseHint.helper";
import {
  ANALYSING,
  LIMITATION,
  VERDICT_TEXT,
} from "../../_helpers/noiseText.helper";
import type { NoiseAnalysisDto } from "../../types";
import { useAnalyseNoise } from "../../contexts";
import { hintColor } from "../../theme";
import { useDialogSnackbar } from "./useDialogSnackbar";
import { TEST_ID } from "../../constants/locators";

interface NoiseHintPanelProps {
  runId: string;
  analysis: NoiseAnalysisValue;
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

export const NoiseHintPanel = ({ runId, analysis }: NoiseHintPanelProps) => {
  const { enqueueSnackbar } = useDialogSnackbar();
  const { analyse, requesting } = useAnalyseNoise(enqueueSnackbar);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const result = isNoiseResult(analysis) ? analysis : null;
  const pending = isNoisePending(analysis);
  const analysing = pending || requesting;
  if (analysing && anchor) {
    setAnchor(null);
  }

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && anchor) {
      event.stopPropagation();
      setAnchor(null);
    }
  };

  const analyseButton = (label: string) => (
    <Button
      size="small"
      variant="outlined"
      data-testid={TEST_ID.analyseNoiseRunButton}
      sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
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
        data-testid={TEST_ID.noiseHintPopoverChip}
        label={`≋ ${view.label}`}
        onClick={
          analysing
            ? undefined
            : (event) => setAnchor(anchor ? null : event.currentTarget)
        }
        onKeyDown={closeOnEscape}
      />
      <Popper
        open={!!anchor}
        anchorEl={anchor}
        placement="bottom-start"
        role="dialog"
        aria-label="Rendering-noise check"
        sx={{ zIndex: "modal" }}
      >
        <ClickAwayListener
          onClickAway={(event) => {
            if (!anchor?.contains(event.target as Node)) {
              setAnchor(null);
            }
          }}
        >
          <Paper
            elevation={8}
            tabIndex={-1}
            ref={(node: HTMLElement | null) => node?.focus()}
            onKeyDown={closeOnEscape}
          >
            <Box
              data-testid={TEST_ID.noiseHintPanel}
              sx={{ p: 2, maxWidth: 520 }}
            >
              {body}
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};
