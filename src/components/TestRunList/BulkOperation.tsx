import { Fragment, useMemo, useState } from "react";
import { Typography, IconButton, LinearProgress } from "@mui/material";
import { BaseModal } from "../BaseModal";
import { useSnackbar } from "notistack";
import {
  CloudDownload,
  Delete,
  LayersClear,
  ThumbDown,
  ThumbUp,
} from "@mui/icons-material";
import { staticService, testRunService } from "../../services";
import { BulkResult, allSucceeded } from "../../services/testRun.service";
import { TestRun, TestStatus } from "../../types";
import { Tooltip } from "../Tooltip";
import { undoSnackbarOptions } from "../UndoSnackbarAction";
import { TAG_FIELDS, tagValuesOf } from "../../_helpers/testRunTags.helper";
import { partialFailureText, pluralize } from "../../_helpers/format.helper";

const testRuns = (count: number): string =>
  `${count} test ${pluralize(count, "run")}`;

const PAST_TENSE: Record<string, string> = {
  Approve: "Approved",
  Reject: "Rejected",
  Delete: "Deleted",
  Download: "Downloaded",
  Clear: "Cleared",
};

const REVIEW_VERBS = new Set(["Approve", "Reject"]);

const processedText = (
  verb: string,
  eligibleCount: number,
  selectedCount: number,
): string =>
  REVIEW_VERBS.has(verb)
    ? `${testRuns(eligibleCount)} ${PAST_TENSE[verb].toLowerCase()}.`
    : `${testRuns(selectedCount)} processed.`;

const partialText = (verb: string, result: BulkResult): string =>
  partialFailureText(
    PAST_TENSE[verb],
    result,
    testRuns(result.succeeded.length + result.failed.length),
  );

export const BulkOperation = ({
  selectedIds,
  rows,
  selectionNoun,
  onProcessed,
}: {
  selectedIds: string[];
  rows: TestRun[];
  selectionNoun: "rows" | "cards";
  // failed ids stay ticked so the action can be retried
  onProcessed: (failedIds: string[]) => void;
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  const [clearIgnoreDialogOpen, setClearIgnoreDialogOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

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
        (row) =>
          selectedIdSet.has(row.id) &&
          [TestStatus.new, TestStatus.unresolved].includes(row.status),
      ),
    [selectedIdSet, rows],
  );
  const idsEligibleForApproveOrReject: string[] = useMemo(
    () => rowsEligibleForApproveOrReject.map((row) => row.id),
    [rowsEligibleForApproveOrReject],
  );

  const toggleApproveDialogOpen = () => {
    setApproveDialogOpen(!approveDialogOpen);
  };

  const toggleRejectDialogOpen = () => {
    setRejectDialogOpen(!rejectDialogOpen);
  };

  const toggleDeleteDialogOpen = () => {
    setDeleteDialogOpen(!deleteDialogOpen);
  };

  const toggleDownloadDialogOpen = () => {
    setDownloadDialogOpen(!downloadDialogOpen);
  };

  const toggleClearIgnoreDialogOpen = () => {
    setClearIgnoreDialogOpen(!clearIgnoreDialogOpen);
  };

  const getTitle = () => {
    if (clearIgnoreDialogOpen) {
      return "Clear Ignore Area For Selected Items";
    }

    return submitButtonText() + " Test Runs";
  };

  const submitButtonText = (): string => {
    if (approveDialogOpen) {
      return "Approve";
    }

    if (rejectDialogOpen) {
      return "Reject";
    }

    if (deleteDialogOpen) {
      return "Delete";
    }

    if (downloadDialogOpen) {
      return "Download";
    }

    if (clearIgnoreDialogOpen) {
      return "Clear";
    }

    return "";
  };

  const confirmationText = (): string => {
    const verb = submitButtonText();
    if (!approveDialogOpen && !rejectDialogOpen) {
      return `Are you sure you want to ${verb.toLowerCase()} ${
        shownSelectedIds.length
      } items?`;
    }

    const eligible = idsEligibleForApproveOrReject.length;
    const settled = shownSelectedIds.length - eligible;
    if (settled === 0) {
      return `${verb} ${testRuns(eligible)}?`;
    }

    return `${verb} ${eligible} of ${shownSelectedIds.length} selected test runs? The other ${settled} ${pluralize(
      settled,
      "is",
      "are",
    )} already settled.`;
  };

  const closeModal = () => {
    if (deleteDialogOpen) {
      return toggleDeleteDialogOpen();
    }

    if (downloadDialogOpen) {
      return toggleDownloadDialogOpen();
    }

    if (approveDialogOpen) {
      return toggleApproveDialogOpen();
    }

    if (rejectDialogOpen) {
      return toggleRejectDialogOpen();
    }

    if (clearIgnoreDialogOpen) {
      return toggleClearIgnoreDialogOpen();
    }
  };

  const getBulkAction = (): Promise<BulkResult> => {
    if (deleteDialogOpen) {
      return testRunService.removeBulk(shownSelectedIds);
    }

    if (downloadDialogOpen) {
      // one screen runs in several browsers and devices, so the name alone collides
      const images = shownSelectedRows.map((item) => ({
        filename: [item.name, ...tagValuesOf(item, TAG_FIELDS)].join(" - "),
        name: item.imageName,
      }));

      return staticService
        .downloadAsZip(images)
        .then(() => allSucceeded(shownSelectedIds));
    }

    if (rejectDialogOpen) {
      return testRunService.rejectBulk(idsEligibleForApproveOrReject);
    }

    if (approveDialogOpen) {
      // the API takes one merge flag per request, so each kind goes on its own
      const mergeIds = rowsEligibleForApproveOrReject
        .filter((row) => row.merge)
        .map((row) => row.id);
      const plainIds = rowsEligibleForApproveOrReject
        .filter((row) => !row.merge)
        .map((row) => row.id);

      const groups = [
        { ids: plainIds, merge: false },
        { ids: mergeIds, merge: true },
      ].filter(({ ids }) => ids.length > 0);
      if (groups.length === 0) {
        return Promise.resolve(allSucceeded([]));
      }

      // one request failing outright must not hide what the other approved
      return Promise.allSettled(
        groups.map(({ ids, merge }) => testRunService.approveBulk(ids, merge)),
      ).then((outcomes) => {
        if (outcomes.every((outcome) => outcome.status === "rejected")) {
          throw outcomes[0].reason;
        }
        return {
          succeeded: outcomes.flatMap((outcome) =>
            outcome.status === "fulfilled" ? outcome.value.succeeded : [],
          ),
          failed: outcomes.flatMap((outcome, index) =>
            outcome.status === "fulfilled"
              ? outcome.value.failed
              : groups[index].ids.map((id) => ({
                  id,
                  message: String(outcome.reason),
                })),
          ),
        };
      });
    }

    return testRunService
      .updateIgnoreAreas({ ids: shownSelectedIds, ignoreAreas: [] })
      .then(() => allSucceeded(shownSelectedIds));
  };

  const dismissDialog = () => {
    if (deleteDialogOpen) {
      return toggleDeleteDialogOpen();
    }

    if (downloadDialogOpen) {
      return toggleDownloadDialogOpen();
    }

    if (approveDialogOpen) {
      return toggleApproveDialogOpen();
    }

    if (clearIgnoreDialogOpen) {
      return toggleClearIgnoreDialogOpen();
    }

    return toggleRejectDialogOpen();
  };

  return (
    <Fragment>
      <Tooltip
        title={`Approve unresolved in selected ${selectionNoun}.`}
        aria-label="approve"
      >
        <span>
          <IconButton
            disabled={selectedIds.length === 0}
            onClick={toggleApproveDialogOpen}
            size="large"
          >
            <ThumbUp data-testid="ThumbUpIcon" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip
        title={`Reject unresolved in selected ${selectionNoun}.`}
        aria-label="reject"
      >
        <span>
          <IconButton
            disabled={selectedIds.length === 0}
            onClick={toggleRejectDialogOpen}
            size="large"
          >
            <ThumbDown />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip
        title={`Download images for selected ${selectionNoun}.`}
        aria-label="download"
      >
        <span>
          <IconButton
            disabled={selectedIds.length === 0}
            onClick={toggleDownloadDialogOpen}
            size="large"
          >
            <CloudDownload data-testid="CloudDownloadIcon" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={`Delete selected ${selectionNoun}.`} aria-label="delete">
        <span>
          <IconButton
            disabled={selectedIds.length === 0}
            onClick={toggleDeleteDialogOpen}
            size="large"
          >
            <Delete data-testid="DeleteIcon" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip
        title={`Clear ignore areas for selected ${selectionNoun}.`}
        aria-label="clear ignore area"
      >
        <span>
          <IconButton
            disabled={selectedIds.length === 0}
            onClick={toggleClearIgnoreDialogOpen}
            size="large"
          >
            <LayersClear data-testid="LayersClearIcon" />
          </IconButton>
        </span>
      </Tooltip>
      <BaseModal
        open={
          deleteDialogOpen ||
          downloadDialogOpen ||
          approveDialogOpen ||
          rejectDialogOpen ||
          clearIgnoreDialogOpen
        }
        title={getTitle()}
        submitButtonText={submitButtonText()}
        onCancel={dismissDialog}
        content={<Typography>{confirmationText()}</Typography>}
        onSubmit={() => {
          // a download changes no run, so its selection stays
          const consumesSelection = !downloadDialogOpen;
          const verb = submitButtonText();
          const message = processedText(
            verb,
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
              const undo = undoSnackbarOptions({
                ids: REVIEW_VERBS.has(verb) ? result.succeeded : [],
                undoneText: `${testRuns(result.succeeded.length)} restored.`,
                enqueueSnackbar,
              });
              if (result.failed.length > 0) {
                enqueueSnackbar(partialText(verb, result), {
                  variant: "warning",
                  ...undo,
                });
              } else {
                enqueueSnackbar(message, { variant: "success", ...undo });
              }
            })
            .catch((err) => {
              setIsProcessing(false);
              enqueueSnackbar(err, {
                variant: "error",
              });
            });
          closeModal();
        }}
      />
      {isProcessing && <LinearProgress />}
    </Fragment>
  );
};
