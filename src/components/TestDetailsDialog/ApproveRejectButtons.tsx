import { Chip, Button } from "@mui/material";
import { styled } from '@mui/material/styles';
import { useSnackbar } from "notistack";
import { useHotkeys } from "react-hotkeys-hook";
import React from "react";
import { testRunService } from "../../services";
import { TestRun } from "../../types";
import { Tooltip } from "../Tooltip";

const PREFIX = 'ApproveRejectButtons';

const classes = {
  actionButton: `${PREFIX}-actionButton`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(() => ({
  [`& .${classes.actionButton}`]: {
    width: 120,
    marginLeft: 4,
    marginRight: 4,
  }
}));

export const ApproveRejectButtons: React.FunctionComponent<{
  testRun: TestRun;
  afterApprove?: () => void;
  afterReject?: () => void;
}> = ({ testRun, afterApprove, afterReject }) => {
  const { enqueueSnackbar } = useSnackbar();


  const approve = () => {
    testRunService
      .approveBulk([testRun.id], testRun.merge)
      .then(() => {
        enqueueSnackbar("Approved", {
          variant: "success",
        });
        afterApprove && afterApprove();
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
  };

  const reject = () => {
    testRunService
      .rejectBulk([testRun.id])
      .then(() => {
        enqueueSnackbar("Rejected", {
          variant: "success",
        });
        afterReject && afterReject();
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
  };

  useHotkeys("a", approve, [testRun]);
  useHotkeys("x", reject, [testRun]);

  return (
    <Root>
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
        <Button
          onClick={approve}
          variant="contained"
          className={classes.actionButton}
        >
          Approve
        </Button>
      </Tooltip>
      <Tooltip title={"Hotkey: X"}>
        <Button
          color="secondary"
          onClick={reject}
          className={classes.actionButton}
        >
          Reject
        </Button>
      </Tooltip>
    </Root>
  );
};
