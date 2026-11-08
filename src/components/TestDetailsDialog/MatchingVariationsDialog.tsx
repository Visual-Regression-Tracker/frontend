import { useCallback, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  IconButton,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useDialogSnackbar } from "./useDialogSnackbar";
import { LightboxPreview, VariationLightbox } from "./VariationLightbox";
import {
  Grid,
  Loading,
  MatchingVariationCard,
  Toolbar,
} from "./MatchingVariationCard";
import { useMatchingVariations } from "./useMatchingVariations";
import { useVariationHotkeys } from "./useVariationHotkeys";
import { findNextUnresolved, forgetActed, rememberActed } from "./actedRuns";
import { Tooltip } from "../Tooltip";
import { undoSnackbarOptions } from "../UndoSnackbarAction";
import { testRunService } from "../../services";
import { ReviewDecision } from "../../services/testRun.service";
import { useTestRunState } from "../../contexts";
import { GO_TO_NEXT_KEY } from "../../constants";
import { parseJson } from "../../_helpers/parseJson";
import { TestRun } from "../../types";
import {
  failureVariant,
  partialFailureText,
  pluralize,
} from "../../_helpers/format.helper";

const variationCount = (count: number): string =>
  `${count} ${pluralize(count, "variation")}`;

export type MatchingVariationsMode = ReviewDecision;

export const MatchingVariationsDialog = ({
  mode,
  testRun,
  groupBy = "customTags",
  onClose,
  navigateTo,
}: {
  mode: MatchingVariationsMode;
  testRun: TestRun;
  groupBy?: string;
  onClose: () => void;
  // goes to another run through the dialog's unsaved-areas check
  navigateTo: (id: string) => void;
}) => {
  const { enqueueSnackbar, enqueueAside } = useDialogSnackbar();
  const { testRuns: allTestRuns, filteredSortedTestRunIds } = useTestRunState();

  const [submitting, setSubmitting] = useState(false);
  const [showDiff, setShowDiff] = useState(true);
  const [preview, setPreview] = useState<LightboxPreview | null>(null);
  const setPreviewDiff = (showDiff: boolean) =>
    setPreview((prev) => prev && { index: prev.index, showDiff });
  const {
    loading,
    data,
    selected,
    variations,
    skipped,
    allShown,
    toggle,
    matched,
    skippedSelection,
  } = useMatchingVariations({ testRun, submitting, enqueueSnackbar });

  const step = useCallback(
    (delta: number) =>
      setPreview((prev) => {
        if (!prev) return prev;
        const index = Math.min(
          allShown.length - 1,
          Math.max(0, prev.index + delta),
        );
        return { index, showDiff: prev.showDiff };
      }),
    [allShown.length],
  );

  useVariationHotkeys({
    preview,
    step,
    setPreviewDiff,
    toggleShowDiff: () => setShowDiff((value) => !value),
  });

  const verb = mode === "approve" ? "Approve" : "Reject";

  const findNext = () =>
    findNextUnresolved(allTestRuns, filteredSortedTestRunIds, testRun);

  const submit = () => {
    const ids = Array.from(selected);
    setSubmitting(true);

    (mode === "approve"
      ? testRunService.approveBulk(ids, testRun.merge)
      : testRunService.rejectBulk(ids)
    )
      .then(({ succeeded, failed }) => {
        // only what the API confirms: a failed run must not be skipped as acted on
        rememberActed(testRun.buildId, succeeded);
        const done = mode === "approve" ? "Approved" : "Rejected";
        const what = variationCount(ids.length);
        const undo = undoSnackbarOptions({
          ids: succeeded,
          decision: mode,
          undoneText: `${variationCount(succeeded.length)} restored.`,
          enqueueSnackbar: enqueueAside,
          onUndone: () => forgetActed(testRun.buildId, succeeded),
        });
        if (failed.length > 0) {
          enqueueSnackbar(
            partialFailureText(done, { succeeded, failed }, what, (id) => {
              const variation = data?.variations.find((run) => run.id === id);
              return variation && `${variation.name} (${labelOf(variation)})`;
            }),
            { variant: failureVariant(failed), ...undo },
          );
          if (succeeded.length > 0) {
            onClose();
          }
          return;
        }
        if (parseJson(localStorage.getItem(GO_TO_NEXT_KEY), false)) {
          const next = findNext();
          if (next) {
            navigateTo(next.id);
          }
        }
        onClose();
        enqueueSnackbar(`${done} ${what}`, {
          // green for approvals only: a rejection is a deliberate outcome, not a success
          variant: mode === "approve" ? "success" : "info",
          ...undo,
        });
      })
      .catch((err: string) => {
        enqueueSnackbar(err, { variant: "error" });
      })
      .finally(() => setSubmitting(false));
  };

  const labelOf = (run: TestRun): string =>
    ((run as unknown as Record<string, string | null>)[groupBy] ?? "") || "—";

  const renderCard = (run: TestRun, reason?: string) => (
    <MatchingVariationCard
      key={run.id}
      run={run}
      label={labelOf(run)}
      selected={selected.has(run.id)}
      showDiff={showDiff}
      reason={reason}
      onToggle={() => toggle(run.id)}
      onOpen={() =>
        setPreview({
          index: allShown.findIndex((item) => item.id === run.id),
          showDiff,
        })
      }
    />
  );

  return (
    <>
      <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>{verb} variations — review before applying</DialogTitle>
        <IconButton
          aria-label="Close dialog"
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            right: 16,
            color: "text.secondary",
          }}
        >
          <Close fontSize="small" />
        </IconButton>
        <DialogContent dividers>
          {submitting && (
            <Loading>
              <CircularProgress />
              <Typography style={{ marginLeft: 12 }}>
                {mode === "approve" ? "Approving" : "Rejecting"}{" "}
                {variationCount(selected.size)}…
              </Typography>
            </Loading>
          )}
          {!submitting && loading && (
            <Loading>
              <CircularProgress />
            </Loading>
          )}
          {!submitting && !loading && data && (
            <>
              <Toolbar>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={matched.all}
                      indeterminate={!matched.all && matched.count > 0}
                      onChange={matched.toggleAll}
                    />
                  }
                  label={`${matched.count} of ${variations.length} matching selected`}
                />
                <Tooltip title="Toggle diff. Hotkey: D">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showDiff}
                        onChange={(e) => setShowDiff(e.target.checked)}
                      />
                    }
                    label="Show diff"
                  />
                </Tooltip>
              </Toolbar>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: "block", margin: "8px 0" }}
              >
                Click a thumbnail to view it full-size.
              </Typography>
              <Grid>{variations.map((run) => renderCard(run))}</Grid>

              {skipped.length > 0 && (
                <>
                  <FormControlLabel
                    sx={{ display: "flex", margin: "16px 0 4px" }}
                    control={
                      <Checkbox
                        checked={skippedSelection.all}
                        indeterminate={
                          !skippedSelection.all && skippedSelection.count > 0
                        }
                        onChange={skippedSelection.toggleAll}
                      />
                    }
                    label={`${skipped.length} didn't match — review separately`}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{
                      display: "block",
                      textAlign: "left",
                      marginBottom: "16px",
                    }}
                  >
                    These don&apos;t match the change you&apos;re reviewing, so
                    they&apos;re unchecked. Open each to inspect and include
                    only if it&apos;s the same intended change.
                  </Typography>
                  <Grid>
                    {skipped.map((run) => renderCard(run, run.reason))}
                  </Grid>
                </>
              )}
            </>
          )}
        </DialogContent>
        {!submitting && (
          <DialogActions>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              color={mode === "reject" ? "error" : "primary"}
              disabled={selected.size === 0}
              onClick={submit}
            >
              {`${verb} ${selected.size} selected`}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <VariationLightbox
        runs={allShown}
        preview={preview}
        onStep={step}
        onShowDiffChange={setPreviewDiff}
        onClose={() => setPreview(null)}
      />
    </>
  );
};
