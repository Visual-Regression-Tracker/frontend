import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
  Box,
  IconButton,
} from "@mui/material";
// named imports: per-icon default imports resolve to module objects in the prod bundle
import {
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useDialogSnackbar } from "./useDialogSnackbar";
import { Tooltip } from "../Tooltip";
import { undoSnackbarOptions } from "../UndoSnackbarAction";
import { testRunService, staticService } from "../../services";
import { MatchingVariations } from "../../services/testRun.service";
import { useTestRunState } from "../../contexts";
import { GO_TO_NEXT_KEY } from "../../constants";
import { imageFor, thumbnailFor } from "../../_helpers/testRunImage.helper";
import { TestRun } from "../../types";
import { TestStatus } from "../../types/testStatus";
import { imageSurface } from "../../theme/tokens";
import { partialFailureText, pluralize } from "../../_helpers/format.helper";

const Toolbar = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
});

const Grid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: 12,
});

const Card = styled("div", {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected?: boolean }>(({ theme, selected }) => ({
  border: `1px solid ${theme.vars?.palette.divider}`,
  borderRadius: 6,
  padding: 6,
  ...(selected && {
    borderColor: theme.vars?.palette.primary.main,
    boxShadow: `0 0 0 1px ${theme.vars?.palette.primary.main}`,
  }),
}));

const CardHead = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const Thumb = styled("img")({
  display: "block",
  width: "100%",
  height: 220,
  objectFit: "contain",
  background: imageSurface.thumbnail,
});

const ThumbButton = styled("button")({
  display: "block",
  width: "100%",
  padding: 0,
  border: "none",
  background: "none",
  cursor: "zoom-in",
});

const Loading = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 48,
});

const Meta = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  padding: "4px 8px 8px",
});

const LightboxRow = styled("div")({
  display: "flex",
  gap: 12,
});

const LightboxHalf = styled("div")({
  flex: 1,
  minWidth: 0,
  textAlign: "center",
});

const LightboxImg = styled("img")({
  maxWidth: "100%",
  maxHeight: "74vh",
  objectFit: "contain",
  verticalAlign: "top",
  background: imageSurface.thumbnail,
});

const variationCount = (count: number): string =>
  `${count} ${pluralize(count, "variation")}`;

export type MatchingVariationsMode = "approve" | "reject";

const byDiffDesc = (a: TestRun, b: TestRun): number =>
  (b.diffPercent ?? 0) - (a.diffPercent ?? 0);

// runs acted on this session, per build: go-to-next skips them before socket state catches up
const acted: { buildId: string | null; ids: Set<string> } = {
  buildId: null,
  ids: new Set(),
};
const rememberActed = (buildId: string, ids: string[]): void => {
  if (acted.buildId !== buildId) {
    acted.buildId = buildId;
    acted.ids = new Set();
  }
  ids.forEach((id) => acted.ids.add(id));
};
const forgetActed = (buildId: string, ids: string[]): void => {
  if (acted.buildId === buildId) {
    ids.forEach((id) => acted.ids.delete(id));
  }
};
const isActed = (buildId: string, id: string): boolean =>
  acted.buildId === buildId && acted.ids.has(id);

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

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<MatchingVariations | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDiff, setShowDiff] = useState(true);
  const [preview, setPreview] = useState<{
    index: number;
    showDiff: boolean;
  } | null>(null);
  const seenVariationIds = useRef<Set<string>>(new Set());

  const loadData = useCallback(
    (background: boolean) => {
      if (!background) {
        setLoading(true);
        setData(null);
      }
      testRunService
        .getMatchingVariations(testRun.id)
        .then((result) => {
          setData(result);
          const presentIds = new Set(
            [...result.variations, ...result.skipped].map((v) => v.id),
          );
          // read now: the updater below runs later, after the ref is replaced
          const seen = seenVariationIds.current;
          if (background) {
            setSelected((prev) => {
              const next = new Set(
                [...prev].filter((id) => presentIds.has(id)),
              );
              result.variations.forEach((v) => {
                if (!seen.has(v.id)) next.add(v.id);
              });
              return next;
            });
          } else {
            setSelected(new Set(result.variations.map((v) => v.id)));
          }
          seenVariationIds.current = new Set(
            result.variations.map((v) => v.id),
          );
        })
        .catch((err) => {
          if (!background) enqueueSnackbar(err, { variant: "error" });
        })
        .finally(() => {
          if (!background) setLoading(false);
        });
    },
    [testRun.id, enqueueSnackbar],
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // background refresh when siblings change mid-build; debounced so a burst refetches once
  const groupKey = useMemo(
    () =>
      allTestRuns
        .filter((run) => run.name === testRun.name)
        .map((run) => `${run.id}:${run.status}`)
        .sort((a: string, b: string) => a.localeCompare(b))
        .join(","),
    [allTestRuns, testRun.name],
  );
  const lastGroupKey = useRef<string | null>(null);
  useEffect(() => {
    if (lastGroupKey.current === null || lastGroupKey.current === groupKey) {
      lastGroupKey.current = groupKey;
      return;
    }
    lastGroupKey.current = groupKey;
    if (submitting) return;
    const timer = setTimeout(() => loadData(true), 1500);
    return () => clearTimeout(timer);
  }, [groupKey, submitting, loadData]);

  const variations = useMemo(
    () => (data ? [...data.variations].sort(byDiffDesc) : []),
    [data],
  );
  const skipped = useMemo(
    () => (data ? [...data.skipped].sort(byDiffDesc) : []),
    [data],
  );
  const allShown = useMemo<TestRun[]>(
    () => [...variations, ...skipped],
    [variations, skipped],
  );

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

  useEffect(() => {
    const swallow = new Set([
      "ArrowLeft",
      "ArrowRight",
      "a",
      "A",
      "x",
      "X",
      "d",
      "D",
    ]);
    const onKey = (e: KeyboardEvent) => {
      if (!swallow.has(e.key)) return;
      // the page behind would act on these keys (arrows, a/x) and change the reviewed run
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "d" || e.key === "D") {
        if (preview)
          setPreview({ index: preview.index, showDiff: !preview.showDiff });
        else setShowDiff((value) => !value);
        return;
      }
      if (preview && e.key === "ArrowLeft") step(-1);
      if (preview && e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [preview, step]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const matchedSelectedCount = variations.filter((v) =>
    selected.has(v.id),
  ).length;
  const allMatchedSelected =
    variations.length > 0 && matchedSelectedCount === variations.length;
  const toggleAllMatched = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      variations.forEach((v) =>
        allMatchedSelected ? next.delete(v.id) : next.add(v.id),
      );
      return next;
    });
  };

  const skippedSelectedCount = skipped.filter((v) => selected.has(v.id)).length;
  const allSkippedSelected =
    skipped.length > 0 && skippedSelectedCount === skipped.length;
  const toggleAllSkipped = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      skipped.forEach((v) =>
        allSkippedSelected ? next.delete(v.id) : next.add(v.id),
      );
      return next;
    });
  };

  const verb = mode === "approve" ? "Approve" : "Reject";

  const goToNextEnabled = (): boolean => {
    try {
      return JSON.parse(localStorage.getItem(GO_TO_NEXT_KEY) || "false");
    } catch {
      return false;
    }
  };

  // wraps round the list, so the last run still finds an earlier unresolved one
  const findNextUnresolved = (): TestRun | undefined => {
    let ordered = allTestRuns;
    if (filteredSortedTestRunIds) {
      const orderOf = new Map(
        filteredSortedTestRunIds.map((id, index) => [id, index] as const),
      );
      ordered = allTestRuns
        .filter((run) => orderOf.has(run.id))
        .sort((a, b) => (orderOf.get(a.id) ?? 0) - (orderOf.get(b.id) ?? 0));
    }
    const currentIndex = ordered.findIndex((run) => run.id === testRun.id);
    const rotated = [
      ...ordered.slice(currentIndex + 1),
      ...ordered.slice(0, currentIndex + 1),
    ];
    return rotated.find(
      (run) =>
        run.status === TestStatus.unresolved &&
        !isActed(testRun.buildId, run.id),
    );
  };

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
          undoneText: `${variationCount(succeeded.length)} restored.`,
          enqueueSnackbar: enqueueAside,
          onUndone: () => forgetActed(testRun.buildId, succeeded),
        });
        if (failed.length > 0) {
          enqueueSnackbar(
            partialFailureText(done, { succeeded, failed }, what),
            { variant: "warning", ...undo },
          );
          if (succeeded.length > 0) {
            onClose();
          }
          return;
        }
        if (goToNextEnabled()) {
          const next = findNextUnresolved();
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
      .catch((err) => {
        enqueueSnackbar(err, { variant: "error" });
      })
      .finally(() => setSubmitting(false));
  };

  const labelOf = (run: TestRun): string =>
    ((run as unknown as Record<string, string | null>)[groupBy] ?? "") || "—";

  const renderCard = (run: TestRun, reason?: string) => {
    const isSelected = selected.has(run.id);
    const openIndex = allShown.findIndex((item) => item.id === run.id);
    return (
      <Card key={run.id} selected={isSelected}>
        <CardHead>
          <FormControlLabel
            sx={{ minWidth: 0, marginLeft: 0, marginRight: "4px" }}
            control={
              <Checkbox
                checked={isSelected}
                onChange={() => toggle(run.id)}
                size="small"
              />
            }
            label={
              <Typography variant="caption" noWrap>
                {labelOf(run)}
              </Typography>
            }
          />
          <Typography variant="caption" color="textSecondary">
            {(run.diffPercent ?? 0).toFixed(1)}%
          </Typography>
        </CardHead>
        <ThumbButton
          type="button"
          onClick={() => setPreview({ index: openIndex, showDiff })}
          aria-label={`View ${labelOf(run)} full size`}
        >
          <Thumb
            src={thumbnailFor(run, showDiff)}
            alt={run.customTags}
            loading="lazy"
          />
        </ThumbButton>
        {reason && (
          <Typography variant="caption" display="block" align="center">
            {reason}
          </Typography>
        )}
      </Card>
    );
  };

  const previewRun = preview ? allShown[preview.index] : null;

  return (
    <>
      <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>{verb} variations — review before applying</DialogTitle>
        <DialogContent dividers>
          {submitting && (
            <Loading>
              <CircularProgress />
              <Typography style={{ marginLeft: 12 }}>
                {mode === "approve" ? "Approving" : "Rejecting"} {selected.size}{" "}
                {pluralize(selected.size, "variation")}…
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
                      checked={allMatchedSelected}
                      indeterminate={
                        !allMatchedSelected && matchedSelectedCount > 0
                      }
                      onChange={toggleAllMatched}
                    />
                  }
                  label={`${matchedSelectedCount} of ${variations.length} matching selected`}
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
                        checked={allSkippedSelected}
                        indeterminate={
                          !allSkippedSelected && skippedSelectedCount > 0
                        }
                        onChange={toggleAllSkipped}
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
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              color={mode === "reject" ? "secondary" : "primary"}
              disabled={selected.size === 0}
              onClick={submit}
            >
              {`${verb} ${selected.size} selected`}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Dialog
        open={!!previewRun}
        onClose={() => setPreview(null)}
        maxWidth="xl"
        fullWidth
      >
        {preview && previewRun && (
          <>
            <DialogTitle>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center">
                  <IconButton
                    onClick={() => step(-1)}
                    disabled={preview.index === 0}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => step(1)}
                    disabled={preview.index === allShown.length - 1}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <span>
                    {previewRun.name} ({preview.index + 1}/{allShown.length})
                  </span>
                </Box>
                <Box display="flex" alignItems="center">
                  <Tooltip title="Toggle diff. Hotkey: D">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preview.showDiff}
                          onChange={(e) =>
                            setPreview({
                              index: preview.index,
                              showDiff: e.target.checked,
                            })
                          }
                        />
                      }
                      label="Show diff"
                    />
                  </Tooltip>
                  <IconButton onClick={() => setPreview(null)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            <Meta>
              <Typography variant="caption">
                OS: {previewRun.os || "—"}
              </Typography>
              <Typography variant="caption">
                Device: {previewRun.device || "—"}
              </Typography>
              <Typography variant="caption">
                Custom Tags: {previewRun.customTags || "—"}
              </Typography>
              <Typography variant="caption">
                Diff: {(previewRun.diffPercent ?? 0).toFixed(2)}%
              </Typography>
              <Typography variant="caption">
                Diff tolerance: {previewRun.diffTollerancePercent ?? 0}%
              </Typography>
            </Meta>
            <DialogContent dividers>
              <LightboxRow>
                <LightboxHalf>
                  <LightboxImg
                    src={staticService.getImage(previewRun.baselineName)}
                    alt="baseline"
                  />
                </LightboxHalf>
                <LightboxHalf>
                  <LightboxImg
                    src={imageFor(previewRun, preview.showDiff)}
                    alt="checkpoint"
                  />
                </LightboxHalf>
              </LightboxRow>
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
};
