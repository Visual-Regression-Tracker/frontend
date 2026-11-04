import { type ReactNode } from "react";
import { Box, Divider, Grid, IconButton } from "@mui/material";
import { WarningRounded } from "@mui/icons-material";
import type { SnackbarMessage } from "notistack";
import { TestRun } from "../../types";
import { testRunService } from "../../services";
import { CommentsPopper } from "../CommentsPopper";
import { Tooltip } from "../Tooltip";
import { TestRunDetails } from "./TestRunDetails";
import type { DialogEnqueue } from "./useDialogSnackbar";

const testRunDetailsSx = { alignItems: "center", paddingLeft: "8px" } as const;

interface TestRunInfoBarProps {
  testRun: TestRun;
  sizeMismatch: boolean;
  ignoreAreasToolbar: ReactNode;
  noiseHint?: ReactNode;
  enqueueSnackbar: DialogEnqueue;
}

export const TestRunInfoBar = ({
  testRun,
  sizeMismatch,
  ignoreAreasToolbar,
  noiseHint,
  enqueueSnackbar,
}: TestRunInfoBarProps) => {
  const saveComment = (comment: string) =>
    testRunService
      .update(testRun.id, {
        comment,
      })
      .then(() =>
        enqueueSnackbar("Comment updated", {
          variant: "success",
        }),
      )
      .catch((err: SnackbarMessage) => {
        enqueueSnackbar(err, {
          variant: "error",
        });
        // still a failure, so the comment box stays open
        throw err;
      });

  return (
    <Box sx={{ mx: 1 }}>
      <Grid container spacing={1} sx={testRunDetailsSx}>
        <TestRunDetails testRun={testRun} noiseHint={noiseHint} />
        {sizeMismatch && (
          <Grid>
            <Tooltip
              title={
                "Image height/width differ from baseline! Cannot calculate diff!"
              }
            >
              <IconButton size="large">
                <WarningRounded
                  data-testid="WarningRoundedIcon"
                  color="secondary"
                />
              </IconButton>
            </Tooltip>
          </Grid>
        )}
        <Grid sx={{ ml: "auto" }}>{ignoreAreasToolbar}</Grid>
        <Grid>
          <CommentsPopper text={testRun.comment} onSave={saveComment} />
        </Grid>
      </Grid>
      <Divider />
    </Box>
  );
};
