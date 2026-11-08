import { useCallback, useMemo, useState } from "react";
import type { EnqueueSnackbar } from "notistack";
import { testRunService } from "../services";
import type { NoiseAnalysisQueued, NoiseAnalysisSkip } from "../types";
import {
  markNoisePending,
  useTestRunDispatch,
  useTestRunState,
} from "./testRun.context";

const QUEUE_FULL = "queue full";

const skipMessage = ({ reason }: NoiseAnalysisSkip) =>
  reason === QUEUE_FULL
    ? "Queue is full, try again in a minute"
    : `Not analysed: ${reason}`;

export const useAnalyseNoise = (enqueue: EnqueueSnackbar) => {
  const { testRuns, selectedTestRun } = useTestRunState();
  const dispatch = useTestRunDispatch();
  const [requesting, setRequesting] = useState(false);

  const analyse = useCallback(
    async (ids: string[]): Promise<NoiseAnalysisQueued | undefined> => {
      setRequesting(true);
      try {
        const result = await testRunService.analyseNoise(ids);
        const { queued, skipped } = result;
        const queueFull = skipped.find(({ reason }) => reason === QUEUE_FULL);
        const warning = queued > 0 ? queueFull : (queueFull ?? skipped[0]);
        if (warning) {
          enqueue(skipMessage(warning), { variant: "warning" });
        }
        if (queued > 0) {
          const skippedIds = new Set(skipped.map(({ id }) => id));
          const seen = new Map(
            [...testRuns, ...(selectedTestRun ? [selectedTestRun] : [])]
              .filter(({ id }) => ids.includes(id) && !skippedIds.has(id))
              .map((run) => [run.id, run.noiseAnalysis]),
          );
          markNoisePending(dispatch, new Date().toISOString(), seen);
        }
        return result;
      } catch (err) {
        enqueue(String(err), { variant: "error" });
        return undefined;
      } finally {
        setRequesting(false);
      }
    },
    [enqueue, dispatch, testRuns, selectedTestRun],
  );

  return useMemo(() => ({ analyse, requesting }), [analyse, requesting]);
};
