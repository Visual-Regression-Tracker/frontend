import { Grid, Tooltip, Chip, Button } from "@material-ui/core";
import { useSnackbar } from "notistack";
import { useHotkeys } from "react-hotkeys-hook";
import React from "react";
import { testRunService } from "../services";
import { TestRun } from "../types";

export const ApproveRejectButtons: React.FunctionComponent<{
  testRun: TestRun;
}> = ({ testRun }) => {
  const { enqueueSnackbar } = useSnackbar();

  const approve = () => {
    testRunService
      .approve(testRun.id, testRun.merge)
      .then(() =>
        enqueueSnackbar("Approved", {
          variant: "success",
        })
      )
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        })
      );
  };

  const reject = () => {
    testRunService
      .reject(testRun.id)
      .then(() =>
        enqueueSnackbar("Rejected", {
          variant: "success",
        })
      )
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        })
      );
  };

  useHotkeys("a", approve, [testRun]);
  useHotkeys("x", reject, [testRun]);

  return (
    <Grid container spacing={2} alignItems="center">
      {testRun.merge && (
        <Grid item>
          <Tooltip title="Will replace target branch baseline if accepted">
            <Chip
              label={`merge into: ${testRun.baselineBranchName}`}
              color="secondary"
              size="small"
            />
          </Tooltip>
        </Grid>
      )}
      <Grid item>
        <Tooltip title={"Hotkey: A"}>
          <Button color="inherit" onClick={approve}>
            Approve
          </Button>
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip title={"Hotkey: X"}>
          <Button color="secondary" onClick={reject}>
            Reject
          </Button>
        </Tooltip>
      </Grid>
    </Grid>
  );
};
