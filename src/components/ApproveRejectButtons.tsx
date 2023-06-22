import { Grid, Chip, Button, makeStyles } from "@material-ui/core";
import { useSnackbar } from "notistack";
import { useHotkeys } from "react-hotkeys-hook";
import React from "react";
import { testRunService } from "../services";
import { TestRun } from "../types";
import { Tooltip } from "./Tooltip";
import { ThumbDown, ThumbUp } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  actionButton: {
    width: 120,
  },
}))

export const ApproveRejectButtons: React.FunctionComponent<{
  testRun: TestRun;
}> = ({ testRun }) => {
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();

  const approve = () => {
    testRunService
      .approveBulk([testRun.id], testRun.merge)
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
      .rejectBulk([testRun.id])
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
    <>
      {testRun.merge && (
          <Tooltip title="Will replace target branch baseline if accepted">
            <Chip
              label={`merge into: ${testRun.baselineBranchName}`}
              color="secondary"
              size="small"
            />
          </Tooltip>
      )}
        <Tooltip title={"Hotkey: A"}>
          <Button onClick={approve} style={{color:"cornflowerblue"}} variant="contained" className={classes.actionButton}>
            Approve
            <ThumbUp fontSize="small" style={{ marginTop: -5, marginLeft: 5}}/>
          </Button>
        </Tooltip>
        <Tooltip title={"Hotkey: X"}>
          <Button color="secondary" onClick={reject} className={classes.actionButton}>
            Reject
            <ThumbDown fontSize="small" style={{ marginLeft: 5}}/>
          </Button>
        </Tooltip>
    </>
  );
};
