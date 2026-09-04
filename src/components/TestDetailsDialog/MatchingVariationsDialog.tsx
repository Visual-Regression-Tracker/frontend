import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { makeStyles } from "@mui/styles";
import { useDialogSnackbar } from "./useDialogSnackbar";
import { useNavigate } from "react-router";
import { Tooltip } from "../Tooltip";
import { testRunService, staticService } from "../../services";
import { MatchingVariations } from "../../services/testRun.service";
import { useTestRunState, useBuildState } from "../../contexts";
import { buildTestRunLocation } from "../../_helpers/route.helpers";
import { GO_TO_NEXT_KEY } from "../../constants";
import { imageFor, thumbnailFor } from "../../_helpers/testRunImage.helper";
import { TestRun } from "../../types";
import { TestStatus } from "../../types/testStatus";

const useStyles = makeStyles(() => ({
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    display: "flex",
    margin: "16px 0 4px",
  },
  sectionSubtitle: {
    display: "block",
    textAlign: "left",
    marginBottom: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 12,
  },
  card: {
    border: "1px solid #e0e0e0",
    borderRadius: 6,
    padding: 6,
  },
  cardSelected: {
    borderColor: "#3f51b5",
    boxShadow: "0 0 0 1px #3f51b5",
  },
  cardHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    minWidth: 0,
    marginLeft: 0,
    marginRight: 4,
  },
  hint: {
    display: "block",
    margin: "8px 0",
  },
  thumb: {
    display: "block",
    width: "100%",
    height: 220,
    objectFit: "contain",
    background: "#fafafa",
  },
  thumbButton: {
    display: "block",
    width: "100%",
    padding: 0,
    border: "none",
    background: "none",
    cursor: "zoom-in",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    padding: "4px 8px 8px",
  },
  lightboxRow: {
    display: "flex",
    gap: 12,
  },
  lightboxHalf: {
    flex: 1,
    minWidth: 0,
    textAlign: "center",
  },
  lightboxImg: {
    maxWidth: "100%",
    maxHeight: "74vh",
    objectFit: "contain",
    verticalAlign: "top",
    background: "#fafafa",
  },
}));

export type MatchingVariationsMode = "approve" | "reject";

const byDiffDesc = (a: TestRun, b: TestRun): number =>
  (b.diffPercent ?? 0) - (a.diffPercent ?? 0);

// Runs approved/rejected this session (per build), so "go to next unresolved" can
// skip them immediately even before socket state catches up. Resets per build.
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
const isActed = (buildId: string, id: string): boolean =>
  acted.buildId === buildId && acted.ids.has(id);

export const MatchingVariationsDialog: React.FunctionComponent<{
  mode: MatchingVariationsMode | null;
  testRun: TestRun;
  groupBy?: string;
  onClose: () => void;
}> = ({ mode, testRun, groupBy = "customTags", onClose }) => {
  const classes = useStyles();
  const { enqueueSnackbar } = useDialogSnackbar();
  const navigate = useNavigate();
  const { testRuns: allTestRuns, filteredSortedTestRunIds } = useTestRunState();
  const { selectedBuild } = useBuildState();

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
      if (!mode) return;
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
          if (background) {
            // Keep the reviewer's current choices; auto-select only newly-arrived matching runs.
            setSelected((prev) => {
              const next = new Set(
                [...prev].filter((id) => presentIds.has(id)),
              );
              result.variations.forEach((v) => {
                if (!seenVariationIds.current.has(v.id)) next.add(v.id);
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
    [mode, testRun.id, enqueueSnackbar],
  );

  // Initial load when the dialog opens.
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Auto-refresh (background) when siblings of this screen change during a running
  // build — e.g. more locales land. Debounced so a burst triggers a single refetch.
  const groupKey = useMemo(
    () =>
      allTestRuns
        .filter((run) => run.name === testRun.name)
        .map((run) => `${run.id}:${run.status}`)
        .sort()
        .join(","),
    [allTestRuns, testRun.name],
  );
  const lastGroupKey = useRef<string | null>(null);
  useEffect(() => {
    if (!mode) {
      lastGroupKey.current = null;
      return;
    }
    if (lastGroupKey.current === null || lastGroupKey.current === groupKey) {
      lastGroupKey.current = groupKey;
      return;
    }
    lastGroupKey.current = groupKey;
    if (submitting) return;
    const timer = setTimeout(() => loadData(true), 1500);
    return () => clearTimeout(timer);
  }, [groupKey, mode, submitting, loadData]);

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
    if (!mode) return;
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
      // Keep these keys from reaching the test-run detail page behind the modal —
      // its arrow navigation and a/x hotkeys would change the reviewed run.
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
  }, [mode, preview, step]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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

  // Honours the shared "Go to the next after Approve/Reject" toggle used by the
  // single approve/reject buttons (persisted in localStorage).
  const goToNextEnabled = (): boolean => {
    try {
      return JSON.parse(localStorage.getItem(GO_TO_NEXT_KEY) || "false");
    } catch {
      return false;
    }
  };

  // Next test run that still needs review (unresolved), skipping everything acted
  // on this session. Wraps around the filtered/sorted list so the last item still
  // finds an earlier unresolved one; returns undefined only when none remain.
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
      .then(() => {
        // Only remember these as acted once the API confirms success, so a failed
        // request doesn't make findNextUnresolved skip still-unresolved runs.
        rememberActed(testRun.buildId, ids);
        // Advance to the next screen that still needs review only when the shared
        // toggle is on (same behaviour as the single Approve/Reject buttons).
        if (goToNextEnabled()) {
          const next = findNextUnresolved();
          if (next) {
            navigate(buildTestRunLocation(selectedBuild?.id, next.id));
          }
        }
        onClose();
        // Shown after we've landed on the destination screen.
        enqueueSnackbar(
          `${mode === "approve" ? "Approved" : "Rejected"} ${
            ids.length
          } variations`,
          {
            // green for an approval only: a rejection is a deliberate outcome,
            // not a success, and must not read as its opposite
            variant: mode === "approve" ? "success" : "info",
          },
        );
      })
      .catch((err) => {
        enqueueSnackbar(err, { variant: "error" });
        setSubmitting(false);
      });
  };

  const labelOf = (run: TestRun): string =>
    ((run as unknown as Record<string, string | null>)[groupBy] ?? "") || "—";

  const renderCard = (run: TestRun, reason?: string) => {
    const isSelected = selected.has(run.id);
    const openIndex = allShown.findIndex((item) => item.id === run.id);
    return (
      <div
        key={run.id}
        className={`${classes.card} ${isSelected ? classes.cardSelected : ""}`}
      >
        <div className={classes.cardHead}>
          <FormControlLabel
            className={classes.cardLabel}
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
        </div>
        <button
          type="button"
          className={classes.thumbButton}
          onClick={() => setPreview({ index: openIndex, showDiff })}
          aria-label={`View ${labelOf(run)} full size`}
        >
          <img
            className={classes.thumb}
            src={thumbnailFor(run, showDiff)}
            alt={run.customTags}
            loading="lazy"
          />
        </button>
        {reason && (
          <Typography variant="caption" display="block" align="center">
            {reason}
          </Typography>
        )}
      </div>
    );
  };

  const previewRun = preview ? allShown[preview.index] : null;

  return (
    <>
      <Dialog open={!!mode} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>{verb} variations — review before applying</DialogTitle>
        <DialogContent dividers>
          {submitting && (
            <div className={classes.loading}>
              <CircularProgress />
              <Typography style={{ marginLeft: 12 }}>
                {mode === "approve" ? "Approving" : "Rejecting"} {selected.size}{" "}
                variations…
              </Typography>
            </div>
          )}
          {!submitting && loading && (
            <div className={classes.loading}>
              <CircularProgress />
            </div>
          )}
          {!submitting && !loading && data && (
            <>
              <div className={classes.toolbar}>
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
              </div>
              <Typography
                variant="caption"
                color="textSecondary"
                className={classes.hint}
              >
                Click a thumbnail to view it full-size.
              </Typography>
              <div className={classes.grid}>
                {variations.map((run) => renderCard(run))}
              </div>

              {skipped.length > 0 && (
                <>
                  <FormControlLabel
                    className={classes.sectionTitle}
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
                    className={classes.sectionSubtitle}
                  >
                    These don't match the change you're reviewing, so they're
                    unchecked. Open each to inspect and include only if it's the
                    same intended change.
                  </Typography>
                  <div className={classes.grid}>
                    {skipped.map((run) => renderCard(run, run.reason))}
                  </div>
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
            <div className={classes.meta}>
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
            </div>
            <DialogContent dividers>
              <div className={classes.lightboxRow}>
                <div className={classes.lightboxHalf}>
                  <img
                    className={classes.lightboxImg}
                    src={staticService.getImage(previewRun.baselineName)}
                    alt="baseline"
                  />
                </div>
                <div className={classes.lightboxHalf}>
                  <img
                    className={classes.lightboxImg}
                    src={imageFor(previewRun, preview.showDiff)}
                    alt="checkpoint"
                  />
                </div>
              </div>
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
};
