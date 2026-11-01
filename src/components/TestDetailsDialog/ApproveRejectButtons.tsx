import { Chip, Button } from "@mui/material";
import { useDialogSnackbar } from "./useDialogSnackbar";
import { useHotkeys } from "react-hotkeys-hook";
import { hotkeyOptions } from "../../_helpers/hotkeys.helper";
import { useMemo } from "react";
import { testRunService } from "../../services";
import { useProjectState, useTestRunState } from "../../contexts";
import { TestRun } from "../../types";
import { TestStatus } from "../../types/testStatus";
import { Tooltip } from "../Tooltip";
import { MatchingVariationsMode } from "./MatchingVariationsDialog";
import {
  isSibling,
  resolveGroupByAxis,
} from "../../_helpers/testRunGroup.helper";

const actionButtonSx = {
  width: 120,
  marginLeft: "4px",
  marginRight: "4px",
};
const wideActionButtonSx = {
  marginLeft: "4px",
  marginRight: "4px",
};

export const ApproveRejectButtons = ({
  testRun,
  afterApprove,
  afterReject,
  onOpenVariations,
}: {
  testRun: TestRun;
  afterApprove?: () => void;
  afterReject?: () => void;
  onOpenVariations: (mode: MatchingVariationsMode) => void;
}) => {
  const { enqueueSnackbar } = useDialogSnackbar();
  const { selectedProjectId, projectList } = useProjectState();
  const { testRuns } = useTestRunState();
  const project = projectList.find((item) => item.id === selectedProjectId);
  // only a true sibling (same on every axis but group-by) makes variations worth showing
  const groupBy = resolveGroupByAxis(project?.bulkApproveGroupBy);
  const hasSiblingsToReview = useMemo(
    () =>
      testRuns.some(
        (run) =>
          run.id !== testRun.id &&
          isSibling(run, testRun, groupBy) &&
          (run.status === TestStatus.unresolved ||
            run.status === TestStatus.new),
      ),
    [testRuns, testRun, groupBy],
  );
  const variationsEnabled =
    !!project?.bulkApproveVariations &&
    testRun.status === TestStatus.unresolved &&
    hasSiblingsToReview;

  const approve = () => {
    testRunService
      .approveOne(testRun.id, testRun.merge)
      .then(() => {
        enqueueSnackbar("Approved", {
          variant: "success",
        });
        afterApprove?.();
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
  };

  const reject = () => {
    testRunService
      .rejectOne(testRun.id)
      .then(() => {
        // not a success: no green tick, as the two buttons sit side by side
        enqueueSnackbar("Rejected", {
          variant: "info",
        });
        afterReject?.();
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
  };

  // the hook keeps the callback from its last deps, so the after-callbacks must be deps too
  useHotkeys("a", approve, hotkeyOptions, [testRun, afterApprove]);
  useHotkeys("x", reject, hotkeyOptions, [testRun, afterReject]);

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
        <Button onClick={approve} variant="contained" sx={actionButtonSx}>
          Approve
        </Button>
      </Tooltip>
      {variationsEnabled && (
        <Tooltip title="Review and approve this screen's matching variations (e.g. all locales) before applying">
          <Button
            onClick={() => onOpenVariations("approve")}
            variant="outlined"
            sx={wideActionButtonSx}
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
            sx={wideActionButtonSx}
          >
            Reject variations
          </Button>
        </Tooltip>
      )}
      <Tooltip title={"Hotkey: X"}>
        <Button color="secondary" onClick={reject} sx={actionButtonSx}>
          Reject
        </Button>
      </Tooltip>
    </>
  );
};
