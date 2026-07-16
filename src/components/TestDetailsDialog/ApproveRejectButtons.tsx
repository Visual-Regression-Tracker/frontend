import { Chip, Button } from "@mui/material";
import { useSnackbar } from "notistack";
import { useHotkeys } from "react-hotkeys-hook";
import React from "react";
import { testRunService } from "../../services";
import { useProjectState, useTestRunState } from "../../contexts";
import { TestRun } from "../../types";
import { TestStatus } from "../../types/testStatus";
import { Tooltip } from "../Tooltip";
import { makeStyles } from "@mui/styles";
import { MatchingVariationsMode } from "./MatchingVariationsDialog";

// Test-variation axes, mirroring the backend. A sibling shares the screen name
// and every axis except the one the project groups by (bulkApproveGroupBy).
const GROUP_BY_AXES = ["customTags", "os", "device", "browser", "viewport"] as const;

const resolveGroupByAxis = (value?: string): (typeof GROUP_BY_AXES)[number] =>
  value && (GROUP_BY_AXES as readonly string[]).includes(value)
    ? (value as (typeof GROUP_BY_AXES)[number])
    : "customTags";

const useStyles = makeStyles(() => ({
  actionButton: {
    width: 120,
    marginLeft: 4,
    marginRight: 4,
  },
  wideActionButton: {
    marginLeft: 4,
    marginRight: 4,
  },
}));

export const ApproveRejectButtons: React.FunctionComponent<{
  testRun: TestRun;
  afterApprove?: () => void;
  afterReject?: () => void;
  onOpenVariations: (mode: MatchingVariationsMode) => void;
}> = ({ testRun, afterApprove, afterReject, onOpenVariations }) => {
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();
  const { selectedProjectId, projectList } = useProjectState();
  const { testRuns } = useTestRunState();
  const project = projectList.find((item) => item.id === selectedProjectId);
  // Only worth showing when there is at least one true sibling still to review —
  // same screen and same on every axis except the group-by one (e.g. locale).
  // A run that merely shares the name but differs on a fixed axis (e.g. another
  // device) is NOT a sibling, so "variations" would be a single approve/reject.
  const groupBy = resolveGroupByAxis(project?.bulkApproveGroupBy);
  const fixedAxes = GROUP_BY_AXES.filter((axis) => axis !== groupBy);
  const hasSiblingsToReview = testRuns.some(
    (run) =>
      run.id !== testRun.id &&
      run.name === testRun.name &&
      run.branchName === testRun.branchName &&
      fixedAxes.every((axis) => run[axis] === testRun[axis]) &&
      (run.status === TestStatus.unresolved || run.status === TestStatus.new),
  );
  const variationsEnabled =
    !!project?.bulkApproveVariations &&
    testRun.status === TestStatus.unresolved &&
    hasSiblingsToReview;

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
        <Button
          onClick={approve}
          variant="contained"
          className={classes.actionButton}
        >
          Approve
        </Button>
      </Tooltip>
      {variationsEnabled && (
        <Tooltip title="Review and approve this screen's matching variations (e.g. all locales) before applying">
          <Button
            onClick={() => onOpenVariations("approve")}
            variant="outlined"
            className={classes.wideActionButton}
          >
            Approve variations
          </Button>
        </Tooltip>
      )}
      {variationsEnabled && (
        <Tooltip title="Review and reject this screen's matching variations (e.g. all locales) before applying">
          <Button
            color="secondary"
            onClick={() => onOpenVariations("reject")}
            variant="outlined"
            className={classes.wideActionButton}
          >
            Reject variations
          </Button>
        </Tooltip>
      )}
      <Tooltip title={"Hotkey: X"}>
        <Button
          color="secondary"
          onClick={reject}
          className={classes.actionButton}
        >
          Reject
        </Button>
      </Tooltip>
    </>
  );
};
