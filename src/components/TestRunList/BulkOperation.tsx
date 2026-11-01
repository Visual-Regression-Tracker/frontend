import { Fragment, ReactNode, useMemo, useState } from "react";
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
import { TestRun } from "../../types";
import { isAwaitingReview } from "../../_helpers/testRunStatus.helper";
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

type BulkAction = "Approve" | "Reject" | "Download" | "Delete" | "Clear";

const ACTION_BUTTONS: {
  action: BulkAction;
  title: string;
  ariaLabel: string;
  icon: ReactNode;
}[] = [
  {
    action: "Approve",
    title: "Approve unresolved in selected",
    ariaLabel: "approve",
    icon: <ThumbUp data-testid="ThumbUpIcon" />,
  },
  {
    action: "Reject",
    title: "Reject unresolved in selected",
    ariaLabel: "reject",
    icon: <ThumbDown />,
  },
  {
    action: "Download",
    title: "Download images for selected",
    ariaLabel: "download",
    icon: <CloudDownload data-testid="CloudDownloadIcon" />,
  },
  {
    action: "Delete",
    title: "Delete selected",
    ariaLabel: "delete",
    icon: <Delete data-testid="DeleteIcon" />,
  },
  {
    action: "Clear",
    title: "Clear ignore areas for selected",
    ariaLabel: "clear ignore area",
    icon: <LayersClear data-testid="LayersClearIcon" />,
  },
];

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
  const [action, setAction] = useState<BulkAction | null>(null);

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
        (row) => selectedIdSet.has(row.id) && isAwaitingReview(row.status),
      ),
    [selectedIdSet, rows],
  );
  const idsEligibleForApproveOrReject: string[] = useMemo(
    () => rowsEligibleForApproveOrReject.map((row) => row.id),
    [rowsEligibleForApproveOrReject],
  );

  const verb = action ?? "";
  const title =
    action === "Clear"
      ? "Clear Ignore Area For Selected Items"
      : `${verb} Test Runs`;

  const confirmationText = (): string => {
    if (!REVIEW_VERBS.has(verb)) {
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

  const getBulkAction = (): Promise<BulkResult> => {
    if (action === "Delete") {
      return testRunService.removeBulk(shownSelectedIds);
    }

    if (action === "Download") {
      // one screen runs in several browsers and devices, so the name alone collides
      const images = shownSelectedRows.map((item) => ({
        filename: [item.name, ...tagValuesOf(item, TAG_FIELDS)].join(" - "),
        name: item.imageName,
      }));

      return staticService
        .downloadAsZip(images)
        .then(() => allSucceeded(shownSelectedIds));
    }

    if (action === "Reject") {
      return testRunService.rejectBulk(idsEligibleForApproveOrReject);
    }

    if (action === "Approve") {
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

  return (
    <Fragment>
      {ACTION_BUTTONS.map(
        ({ action: buttonAction, title, ariaLabel, icon }) => (
          <Tooltip
            key={buttonAction}
            title={`${title} ${selectionNoun}.`}
            aria-label={ariaLabel}
          >
            <span>
              <IconButton
                disabled={selectedIds.length === 0}
                onClick={() => setAction(buttonAction)}
                size="large"
              >
                {icon}
              </IconButton>
            </span>
          </Tooltip>
        ),
      )}
      <BaseModal
        open={action !== null}
        title={title}
        submitButtonText={verb}
        onCancel={() => setAction(null)}
        content={<Typography>{confirmationText()}</Typography>}
        onSubmit={() => {
          // a download changes no run, so its selection stays
          const consumesSelection = action !== "Download";
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
          setAction(null);
        }}
      />
      {isProcessing && <LinearProgress />}
    </Fragment>
  );
};
