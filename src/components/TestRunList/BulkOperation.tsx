import { Fragment, ReactNode, useMemo, useState } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import { BaseModal } from "../BaseModal";
import { useSnackbar } from "notistack";
import {
  BlurOn,
  CloudDownload,
  DeleteOutlineOutlined,
  LayersClear,
  ThumbDown,
  ThumbUp,
} from "@mui/icons-material";
import { staticService, testRunService } from "../../services";
import { BulkResult, allSucceeded } from "../../services/testRun.service";
import { NoiseAnalysisQueued, TestRun } from "../../types";
import { useAnalyseNoise, useNoiseAnalysisAvailable } from "../../contexts";
import { isAwaitingReview } from "../../_helpers/testRunStatus.helper";
import { SelectionAction, SelectionBar } from "../SelectionBar";
import { undoSnackbarOptions } from "../UndoSnackbarAction";
import {
  TAG_FIELDS,
  runLabel,
  tagValuesOf,
} from "../../_helpers/testRunTags.helper";
import {
  failureVariant,
  partialFailureText,
  pluralize,
} from "../../_helpers/format.helper";

const testRuns = (count: number): string =>
  `${count} test ${pluralize(count, "run")}`;

type BulkAction = "Approve" | "Reject" | "Download" | "Delete" | "Clear";

const PAST_TENSE: Record<BulkAction, string> = {
  Approve: "Approved",
  Reject: "Rejected",
  Delete: "Deleted",
  Download: "Downloaded",
  Clear: "Cleared",
};

const isReview = (action: BulkAction | null): action is "Approve" | "Reject" =>
  action === "Approve" || action === "Reject";

const ACTION_BUTTONS: {
  action: BulkAction;
  label: string;
  icon: ReactNode;
  color?: "error";
}[] = [
  { action: "Approve", label: "Approve", icon: <ThumbUp /> },
  { action: "Reject", label: "Reject", icon: <ThumbDown /> },
  { action: "Download", label: "Download zip", icon: <CloudDownload /> },
  { action: "Clear", label: "Clear ignore areas…", icon: <LayersClear /> },
  {
    action: "Delete",
    label: "Delete…",
    icon: <DeleteOutlineOutlined />,
    color: "error",
  },
];

const ANALYSE_BUTTON = {
  label: "Analyse rendering noise",
  icon: <BlurOn />,
};

const analysedText = ({ queued, skipped }: NoiseAnalysisQueued): string =>
  `Analysing ${testRuns(queued)}${
    skipped.length > 0 ? `, ${skipped.length} skipped` : ""
  }.`;

const processedText = (
  verb: BulkAction,
  eligibleCount: number,
  selectedCount: number,
): string =>
  isReview(verb)
    ? `${testRuns(eligibleCount)} ${PAST_TENSE[verb].toLowerCase()}.`
    : `${testRuns(selectedCount)} processed.`;

const partialText = (
  verb: BulkAction,
  result: BulkResult,
  rows: TestRun[],
): string =>
  partialFailureText(
    PAST_TENSE[verb],
    result,
    testRuns(result.succeeded.length + result.failed.length),
    (id) => {
      const row = rows.find((candidate) => candidate.id === id);
      return row && runLabel(row);
    },
  );

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

  const verb = action ?? "";
  const title =
    action === "Clear"
      ? "Clear Ignore Area For Selected Items"
      : `${verb} Test Runs`;

  const confirmationText = (): string => {
    if (!isReview(action)) {
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

  const analyseSelected = () =>
    analyse(shownSelectedIds).then((result) => {
      if (result && result.queued > 0) {
        enqueueSnackbar(analysedText(result), { variant: "success" });
      }
    });

  const [approve, reject, download, ...rest] = ACTION_BUTTONS.map(
    ({ action: buttonAction, ...button }): SelectionAction => ({
      ...button,
      onClick: () => setAction(buttonAction),
    }),
  );
  const analysis: SelectionAction[] = available
    ? [
        {
          ...ANALYSE_BUTTON,
          disabled: requesting,
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
        title={title}
        submitButtonText={verb}
        onCancel={() => setAction(null)}
        content={<Typography>{confirmationText()}</Typography>}
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
