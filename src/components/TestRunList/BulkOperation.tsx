import { Fragment, useMemo, useState } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import { BaseModal } from "../BaseModal";
import { useSnackbar } from "notistack";
import { TestRun, TestStatus } from "../../types";
import { BulkResult } from "../../services/testRun.service";
import { useAnalyseNoise, useNoiseAnalysisAvailable } from "../../contexts";
import { isAwaitingReview } from "../../_helpers/testRunStatus.helper";
import { SelectionAction, SelectionBar } from "../SelectionBar";
import { undoSnackbarOptions } from "../UndoSnackbarAction";
import { failureVariant, pluralize } from "../../_helpers/format.helper";
import { runBulkAction } from "./bulkRequests";
import {
  ACTION_BUTTONS,
  ANALYSE_BUTTON,
  type BulkAction,
  analysedText,
  isReview,
  partialText,
  processedText,
  testRuns,
} from "./bulkOperation.constants";

export const BulkOperation = ({
  selectedIds,
  rows,
  onSelectAll,
  onClear,
  onProcessed,
}: {
  selectedIds: string[];
  rows: TestRun[];
  onSelectAll: () => void;
  onClear: () => void;
  // failed ids stay ticked so the action can be retried
  onProcessed: (failedIds: string[]) => void;
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [action, setAction] = useState<BulkAction | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const available = useNoiseAnalysisAvailable();
  const { analyse, requesting } = useAnalyseNoise(enqueueSnackbar);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // the actions reach only the filtered rows, so ticks a filter hid are left alone
  const shownSelectedRows: TestRun[] = useMemo(
    () => rows.filter((row) => selectedIdSet.has(row.id)),
    [selectedIdSet, rows],
  );
  const shownSelectedIds: string[] = useMemo(
    () => shownSelectedRows.map((row) => row.id),
    [shownSelectedRows],
  );

  const rowsEligibleForApproveOrReject: TestRun[] = useMemo(
    () =>
      rows.filter(
        (row) => selectedIdSet.has(row.id) && isAwaitingReview(row.status),
      ),
    [selectedIdSet, rows],
  );
  const idsEligibleForApproveOrReject: string[] = useMemo(
    () => rowsEligibleForApproveOrReject.map((row) => row.id),
    [rowsEligibleForApproveOrReject],
  );

  const describe = (verb: BulkAction) => {
    const targetCount = isReview(verb)
      ? idsEligibleForApproveOrReject.length
      : shownSelectedIds.length;
    const settled = shownSelectedIds.length - targetCount;
    let text = `${verb} ${testRuns(targetCount)}?`;
    if (verb === "Clear") {
      text = `Clear ignore areas on ${testRuns(targetCount)}?`;
    } else if (isReview(verb) && settled > 0) {
      text = `${verb} ${targetCount} of ${shownSelectedIds.length} selected test runs? The other ${settled} ${pluralize(
        settled,
        "is",
        "are",
      )} already settled.`;
    }
    return {
      verb,
      text,
      title:
        verb === "Clear"
          ? "Clear ignore areas"
          : `${verb} ${pluralize(targetCount, "test run")}`,
    };
  };

  const [opened, setOpened] = useState<ReturnType<typeof describe> | null>(
    null,
  );
  const open = (verb: BulkAction) => {
    setOpened(describe(verb));
    setAction(verb);
  };

  const getBulkAction = (): Promise<BulkResult> =>
    runBulkAction({
      action,
      shownSelectedIds,
      shownSelectedRows,
      eligibleRows: rowsEligibleForApproveOrReject,
    });

  const unresolvedSelectedIds = useMemo(
    () =>
      shownSelectedRows
        .filter((row) => row.status === TestStatus.unresolved)
        .map((row) => row.id),
    [shownSelectedRows],
  );

  const analyseSelected = () =>
    analyse(unresolvedSelectedIds).then((result) => {
      if (result && result.queued > 0) {
        enqueueSnackbar(analysedText(result), { variant: "success" });
      }
    });

  const [approve, reject, download, ...rest] = ACTION_BUTTONS.map(
    ({ action: buttonAction, ...button }): SelectionAction => ({
      ...button,
      onClick: () => open(buttonAction),
    }),
  );
  const analysis: SelectionAction[] = available
    ? [
        {
          ...ANALYSE_BUTTON,
          disabled: requesting || unresolvedSelectedIds.length === 0,
          onClick: () => void analyseSelected(),
        },
      ]
    : [];
  const actions = [approve, reject, download, ...analysis, ...rest];

  return (
    <Fragment>
      {shownSelectedIds.length > 0 && (
        <Box sx={{ paddingX: 2, paddingBottom: 1 }}>
          <SelectionBar
            selected={shownSelectedIds.length}
            total={rows.length}
            actions={actions}
            onSelectAll={onSelectAll}
            onClose={onClear}
          />
        </Box>
      )}
      <BaseModal
        open={action !== null}
        title={opened?.title ?? ""}
        submitButtonText={opened?.verb ?? ""}
        submitColor={
          opened?.verb === "Delete" || opened?.verb === "Clear"
            ? "error"
            : "primary"
        }
        onCancel={() => setAction(null)}
        content={<Typography>{opened?.text}</Typography>}
        onSubmit={() => {
          if (!action) {
            return;
          }
          // a download changes no run, so its selection stays
          const consumesSelection = action !== "Download";
          const message = processedText(
            action,
            idsEligibleForApproveOrReject.length,
            shownSelectedIds.length,
          );
          setIsProcessing(true);
          getBulkAction()
            .then((result) => {
              setIsProcessing(false);
              if (consumesSelection) {
                onProcessed(result.failed.map((failure) => failure.id));
              }
              const undo = isReview(action)
                ? undoSnackbarOptions({
                    ids: result.succeeded,
                    decision: action === "Approve" ? "approve" : "reject",
                    undoneText: `${testRuns(result.succeeded.length)} restored.`,
                    enqueueSnackbar,
                  })
                : {};
              if (result.failed.length > 0) {
                enqueueSnackbar(partialText(action, result, rows), {
                  variant: failureVariant(result.failed),
                  ...undo,
                });
              } else {
                enqueueSnackbar(message, { variant: "success", ...undo });
              }
            })
            .catch((err: string) => {
              setIsProcessing(false);
              enqueueSnackbar(err, {
                variant: "error",
              });
            });
          setAction(null);
        }}
      />
      {isProcessing && <LinearProgress />}
    </Fragment>
  );
};
