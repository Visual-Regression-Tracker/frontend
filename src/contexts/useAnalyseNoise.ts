import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnqueueSnackbar } from "notistack";
import { testRunService } from "../services";
import type { NoiseAnalysisSkip, TestRun } from "../types";
import { isNoisePending, isNoiseResult } from "../_helpers/noiseHint.helper";
import { useTestRunState } from "./testRun.context";

const PENDING_EVENT_WAIT_MS = 3000;

const QUEUE_FULL = "queue full";

type Snapshot = Map<string, string>;

const skipMessage = ({ reason }: NoiseAnalysisSkip) =>
  reason === QUEUE_FULL
    ? "Queue is full, try again in a minute"
    : `Not analysed: ${reason}`;

const signatureOf = (analysis: TestRun["noiseAnalysis"]) => {
  if (isNoisePending(analysis)) {
    return `pending:${analysis.requestedAt}`;
  }
  return isNoiseResult(analysis) ? `result:${analysis.computedAt}` : "none";
};

const analysisById = (
  wanted: { has(id: string): boolean },
  testRuns: TestRun[],
  selectedTestRun?: TestRun,
): Snapshot => {
  const signatures: Snapshot = new Map();
  for (const run of testRuns) {
    if (wanted.has(run.id)) {
      signatures.set(run.id, signatureOf(run.noiseAnalysis));
    }
  }
  if (selectedTestRun && wanted.has(selectedTestRun.id)) {
    signatures.set(
      selectedTestRun.id,
      signatureOf(selectedTestRun.noiseAnalysis),
    );
  }
  return signatures;
};

const allChanged = (
  awaiting: Snapshot,
  testRuns: TestRun[],
  selectedTestRun?: TestRun,
): boolean =>
  [...analysisById(awaiting, testRuns, selectedTestRun)].every(
    ([id, signature]) => signature !== awaiting.get(id),
  );

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
      const before = analysisById(new Set(ids), testRuns, selectedTestRun);
      setPosting(true);
      try {
        const { queued, skipped } = await testRunService.analyseNoise(ids);
        const queueFull = skipped.find(({ reason }) => reason === QUEUE_FULL);
        const warning = queued > 0 ? queueFull : (queueFull ?? skipped[0]);
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
