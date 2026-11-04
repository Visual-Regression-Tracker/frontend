import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnqueueSnackbar } from "notistack";
import { testRunService } from "../services";
import { isNoisePending } from "../_helpers/noiseHint.helper";
import type { NoiseAnalysisSkip } from "../types";
import { useTestRunState } from "./testRun.context";

const PENDING_EVENT_WAIT_MS = 3000;

const QUEUE_FULL = "queue full";

const skipMessage = ({ reason }: NoiseAnalysisSkip) =>
  reason === QUEUE_FULL
    ? "Queue is full, try again in a minute"
    : `Not analysed: ${reason}`;

export const useAnalyseNoise = (enqueue: EnqueueSnackbar) => {
  const { testRuns, selectedTestRun } = useTestRunState();
  const [posting, setPosting] = useState(false);
  const [awaiting, setAwaiting] = useState<string[]>([]);

  const shownPending = useMemo(() => {
    if (awaiting.length === 0) {
      return false;
    }
    const wanted = new Set(awaiting);
    const seen = (
      selectedTestRun ? [...testRuns, selectedTestRun] : testRuns
    ).filter((run) => wanted.has(run.id));
    return (
      seen.length > 0 && seen.every((run) => isNoisePending(run.noiseAnalysis))
    );
  }, [awaiting, testRuns, selectedTestRun]);

  if (shownPending) {
    setAwaiting([]);
  }

  useEffect(() => {
    if (awaiting.length === 0) {
      return;
    }
    const timer = setTimeout(() => setAwaiting([]), PENDING_EVENT_WAIT_MS);
    return () => clearTimeout(timer);
  }, [awaiting]);

  const analyse = useCallback(
    async (ids: string[]): Promise<boolean> => {
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
          const notQueued = new Set(skipped.map(({ id }) => id));
          setAwaiting(ids.filter((id) => !notQueued.has(id)));
        }
        return queued > 0;
      } catch (err) {
        enqueue(String(err), { variant: "error" });
        return false;
      } finally {
        setPosting(false);
      }
    },
    [enqueue],
  );

  return { analyse, requesting: posting || awaiting.length > 0 };
};
