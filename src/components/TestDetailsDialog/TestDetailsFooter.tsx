import { type ReactNode, useEffect, useState } from "react";
import { Checkbox, FormControlLabel, Grid, Typography } from "@mui/material";
import { isAwaitingReview } from "../../_helpers/testRunStatus.helper";
import { GO_TO_NEXT_KEY } from "../../constants";
import { parseJson } from "../../_helpers/parseJson";
import { TestRun } from "../../types";
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
  zoomControls: ReactNode;
  onNext: () => void;
  onOpenVariations: (mode: MatchingVariationsMode) => void;
}

export const TestDetailsFooter = ({
  testRun,
  zoomControls,
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

  return (
    <Grid container sx={footerSx}>
      <Grid size={3} sx={scaleActionsSx}>
        {zoomControls}
      </Grid>
      <Grid size={6} sx={centerActionsSx}>
        {isAwaitingReview(testRun.status) && (
          <ApproveRejectButtons
            testRun={testRun}
            afterApprove={handleGoToNextAutomatically}
            afterReject={handleGoToNextAutomatically}
            onOpenVariations={onOpenVariations}
          />
        )}
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
