import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnqueueSnackbar } from "notistack";
import { testRunService } from "../services";
import type { NoiseAnalysisSkip, TestRun } from "../types";
import { useTestRunState } from "./testRun.context";

const PENDING_EVENT_WAIT_MS = 3000;

const QUEUE_FULL = "queue full";

type Snapshot = Map<string, TestRun["noiseAnalysis"]>;

const skipMessage = ({ reason }: NoiseAnalysisSkip) =>
  reason === QUEUE_FULL
    ? "Queue is full, try again in a minute"
    : `Not analysed: ${reason}`;

const snapshotOf = (
  ids: string[],
  testRuns: TestRun[],
  selectedTestRun?: TestRun,
): Snapshot => {
  const wanted = new Set(ids);
  const snapshot = new Map<string, TestRun["noiseAnalysis"]>();
  for (const run of testRuns) {
    if (wanted.has(run.id)) {
      snapshot.set(run.id, run.noiseAnalysis);
    }
  }
  if (selectedTestRun && wanted.has(selectedTestRun.id)) {
    snapshot.set(selectedTestRun.id, selectedTestRun.noiseAnalysis);
  }
  return snapshot;
};

const allChanged = (
  awaiting: Snapshot,
  testRuns: TestRun[],
  selectedTestRun?: TestRun,
): boolean => {
  let seen = false;
  if (selectedTestRun && awaiting.has(selectedTestRun.id)) {
    if (selectedTestRun.noiseAnalysis === awaiting.get(selectedTestRun.id)) {
      return false;
    }
    seen = true;
  }
  for (const run of testRuns) {
    if (run.id === selectedTestRun?.id || !awaiting.has(run.id)) {
      continue;
    }
    if (run.noiseAnalysis === awaiting.get(run.id)) {
      return false;
    }
    seen = true;
  }
  return seen;
};

export const useAnalyseNoise = (enqueue: EnqueueSnackbar) => {
  const { testRuns, selectedTestRun } = useTestRunState();
  const [posting, setPosting] = useState(false);
  const [awaiting, setAwaiting] = useState<Snapshot>();

  const settled = useMemo(
    () => !!awaiting && allChanged(awaiting, testRuns, selectedTestRun),
    [awaiting, testRuns, selectedTestRun],
  );

  if (settled) {
    setAwaiting(undefined);
  }

  useEffect(() => {
    if (!awaiting) {
      return;
    }
    const timer = setTimeout(
      () => setAwaiting(undefined),
      PENDING_EVENT_WAIT_MS,
    );
    return () => clearTimeout(timer);
  }, [awaiting]);

  const analyse = useCallback(
    async (ids: string[]) => {
      const before = snapshotOf(ids, testRuns, selectedTestRun);
      setPosting(true);
      try {
        const { queued, skipped } = await testRunService.analyseNoise(ids);
        const warning =
          queued > 0
            ? skipped.find(({ reason }) => reason === QUEUE_FULL)
            : skipped[0];
        if (warning) {
          enqueue(skipMessage(warning), { variant: "warning" });
        }
        if (queued > 0) {
          for (const { id } of skipped) {
            before.delete(id);
          }
          setAwaiting(before.size > 0 ? before : undefined);
        }
      } catch (err) {
        enqueue(String(err), { variant: "error" });
      } finally {
        setPosting(false);
      }
    },
    [enqueue, testRuns, selectedTestRun],
  );

  const requesting = posting || (!!awaiting && !settled);
  return useMemo(() => ({ analyse, requesting }), [analyse, requesting]);
};
