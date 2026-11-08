import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { testRunService } from "../../services";
import { MatchingVariations } from "../../services/testRun.service";
import { useTestRunState } from "../../contexts";
import { byDiffDesc } from "../../_helpers/testRunOrder.helper";
import { TestRun } from "../../types";

export function useMatchingVariations({
  testRun,
  submitting,
  enqueueSnackbar,
}: {
  testRun: TestRun;
  submitting: boolean;
  enqueueSnackbar: (message: string, options: { variant: "error" }) => unknown;
}) {
  const { testRuns: allTestRuns } = useTestRunState();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MatchingVariations | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const seenVariationIds = useRef<Set<string>>(new Set());

  const loadData = useCallback(
    (background: boolean) => {
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
        .catch((err: string) => {
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

  const selectionOf = (runs: TestRun[]) => {
    const count = runs.filter((run) => selected.has(run.id)).length;
    const all = runs.length > 0 && count === runs.length;
    const toggleAll = () =>
      setSelected((prev) => {
        const next = new Set(prev);
        runs.forEach((run) => (all ? next.delete(run.id) : next.add(run.id)));
        return next;
      });
    return { count, all, toggleAll };
  };
  const matched = selectionOf(variations);
  const skippedSelection = selectionOf(skipped);

  return {
    loading,
    data,
    selected,
    variations,
    skipped,
    allShown,
    toggle,
    matched,
    skippedSelection,
  };
}
