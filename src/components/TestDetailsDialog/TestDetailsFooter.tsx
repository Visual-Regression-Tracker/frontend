import { type ReactNode, useEffect, useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { NavigateBefore, NavigateNext } from "@mui/icons-material";
import { useHotkeys } from "react-hotkeys-hook";
import { hotkeyOptions } from "../../_helpers/hotkeys.helper";
import { isAwaitingReview } from "../../_helpers/testRunStatus.helper";
import { GO_TO_NEXT_KEY } from "../../constants";
import { parseJson } from "../../_helpers/parseJson";
import { TestRun } from "../../types";
import { Tooltip } from "../Tooltip";
import { ApproveRejectButtons } from "./ApproveRejectButtons";
import { MatchingVariationsMode } from "./MatchingVariationsDialog";

const footerSx = { bgcolor: "background.default" } as const;
const scaleActionsSx = { display: "flex", alignItems: "center" } as const;
const testRunActionsSx = {
  justifyContent: "flex-end",
  display: "flex",
  alignItems: "center",
  alignContent: "center",
} as const;
const centerActionsSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "4px",
} as const;

interface TestDetailsFooterProps {
  testRun: TestRun;
  currentRunIndex: number;
  totalTestRunCount: number;
  zoomControls: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  onOpenVariations: (mode: MatchingVariationsMode) => void;
}

export const TestDetailsFooter = ({
  testRun,
  currentRunIndex,
  totalTestRunCount,
  zoomControls,
  onPrevious,
  onNext,
  onOpenVariations,
}: TestDetailsFooterProps) => {
  const [goToNextAutomatically, setGoToNextAutomatically] = useState(() =>
    parseJson(localStorage.getItem(GO_TO_NEXT_KEY), false),
  );

  useEffect(() => {
    localStorage.setItem(GO_TO_NEXT_KEY, JSON.stringify(goToNextAutomatically));
  }, [goToNextAutomatically]);

  const handleGoToNextAutomatically = () => {
    if (goToNextAutomatically) {
      onNext();
    }
  };

  useHotkeys("right", onNext, hotkeyOptions, [currentRunIndex, onNext]);
  useHotkeys("left", onPrevious, hotkeyOptions, [currentRunIndex, onPrevious]);

  return (
    <Grid container sx={footerSx}>
      <Grid size={3} sx={scaleActionsSx}>
        {zoomControls}
      </Grid>
      <Grid size={6} sx={centerActionsSx}>
        <Tooltip title={"Hotkey: ArrowLeft"}>
          <IconButton
            color="secondary"
            style={{
              visibility: currentRunIndex > 0 ? "visible" : "hidden",
            }}
            onClick={onPrevious}
            size="large"
          >
            <NavigateBefore />
          </IconButton>
        </Tooltip>
        {isAwaitingReview(testRun.status) && (
          <ApproveRejectButtons
            testRun={testRun}
            afterApprove={handleGoToNextAutomatically}
            afterReject={handleGoToNextAutomatically}
            onOpenVariations={onOpenVariations}
          />
        )}
        <Tooltip title={"Hotkey: ArrowRight"}>
          <IconButton
            color="secondary"
            style={{
              visibility:
                totalTestRunCount > currentRunIndex + 1 ? "visible" : "hidden",
            }}
            onClick={onNext}
            size="large"
          >
            <NavigateNext />
          </IconButton>
        </Tooltip>
      </Grid>
      <Grid size={3} sx={testRunActionsSx}>
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              size="small"
              checked={goToNextAutomatically}
              onChange={(e) => setGoToNextAutomatically(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2" color="textSecondary">
              Go to the next after Approve/Reject
            </Typography>
          }
        />
      </Grid>
    </Grid>
  );
};
