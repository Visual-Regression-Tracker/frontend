import { Chip, Button } from "@mui/material";
import { CheckRounded, ClearRounded } from "@mui/icons-material";
import { HotkeyHint } from "../HotkeyHint";
import { VariantType } from "notistack";
import { useDialogSnackbar } from "./useDialogSnackbar";
import { useHotkeys } from "react-hotkeys-hook";
import { hotkeyOptions } from "../../_helpers/hotkeys.helper";
import { failureVariant } from "../../_helpers/format.helper";
import { useMemo } from "react";
import { BulkResult, ReviewDecision, testRunService } from "../../services";
import { useSelectedProject, useTestRunState } from "../../contexts";
import { TestRun } from "../../types";
import { TestStatus } from "../../types/testStatus";
import { isAwaitingReview } from "../../_helpers/testRunStatus.helper";
import { Tooltip } from "../Tooltip";
import { undoSnackbarOptions } from "../UndoSnackbarAction";
import { MatchingVariationsMode } from "./MatchingVariationsDialog";
import {
  isSibling,
  resolveGroupByAxis,
} from "../../_helpers/testRunGroup.helper";

const actionButtonSx = {
  marginLeft: "4px",
  marginRight: "4px",
  textTransform: "none",
} as const;

const DECIDED: Record<ReviewDecision, { text: string; variant: VariantType }> =
  {
    approve: { text: "Approved", variant: "success" },
    // not a success: no green tick, as the two buttons sit side by side
    reject: { text: "Rejected", variant: "info" },
  };

export const ApproveRejectButtons = ({
  testRun,
  afterApprove,
  afterReject,
  undoInToast,
  onOpenVariations,
}: {
  testRun: TestRun;
  afterApprove?: () => void;
  afterReject?: () => void;
  undoInToast: boolean;
  onOpenVariations: (mode: MatchingVariationsMode) => void;
}) => {
  const { enqueueSnackbar, enqueueAside } = useDialogSnackbar();
  const project = useSelectedProject();
  const { testRuns } = useTestRunState();
  // only a true sibling (same on every axis but group-by) makes variations worth showing
  const groupBy = resolveGroupByAxis(project?.bulkApproveGroupBy);
  const hasSiblingsToReview = useMemo(
    () =>
      testRuns.some(
        (run) =>
          run.id !== testRun.id &&
          isSibling(run, testRun, groupBy) &&
          isAwaitingReview(run.status),
      ),
    [testRuns, testRun, groupBy],
  );
  const variationsEnabled =
    !!project?.bulkApproveVariations &&
    testRun.status === TestStatus.unresolved &&
    hasSiblingsToReview;

  const decide = (
    decision: ReviewDecision,
    request: Promise<BulkResult>,
    after?: () => void,
  ) => {
    request
      .then(({ failed }) => {
        if (failed.length > 0) {
          const variant = failureVariant(failed);
          enqueueSnackbar(
            variant === "error"
              ? `The server could not ${decision} this test run. Try again.`
              : failed[0].message.replace(
                  `Test run ${testRun.id}`,
                  "This test run",
                ),
            { variant },
          );
          return;
        }
        enqueueSnackbar(DECIDED[decision].text, {
          variant: DECIDED[decision].variant,
          ...(undoInToast &&
            undoSnackbarOptions({
              ids: [testRun.id],
              decision,
              undoneText: "Undone",
              enqueueSnackbar: enqueueAside,
            })),
        });
        after?.();
      })
      .catch((err: string) => enqueueSnackbar(err, { variant: "error" }));
  };

  const approve = () =>
    decide(
      "approve",
      testRunService.approveBulk([testRun.id], testRun.merge),
      afterApprove,
    );

  const reject = () =>
    decide("reject", testRunService.rejectBulk([testRun.id]), afterReject);

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
      <Button
        onClick={approve}
        variant="contained"
        aria-keyshortcuts="a"
        startIcon={<CheckRounded />}
        sx={actionButtonSx}
      >
        Approve
        <HotkeyHint>A</HotkeyHint>
      </Button>
      <Button
        color="secondary"
        variant="outlined"
        aria-keyshortcuts="x"
        onClick={reject}
        startIcon={<ClearRounded />}
        sx={actionButtonSx}
      >
        Reject
        <HotkeyHint>X</HotkeyHint>
      </Button>
      {variationsEnabled && (
        <Tooltip title="Review and approve this screen's matching variations (e.g. all locales) before applying">
          <Button
            onClick={() => onOpenVariations("approve")}
            sx={actionButtonSx}
          >
            Approve variations…
          </Button>
        </Tooltip>
      )}
      {variationsEnabled && (
        <Tooltip title="Review and reject this screen's matching variations (e.g. all locales) before applying">
          <Button
            color="secondary"
            onClick={() => onOpenVariations("reject")}
            sx={actionButtonSx}
          >
            Reject variations…
          </Button>
        </Tooltip>
      )}
    </>
  );
};
