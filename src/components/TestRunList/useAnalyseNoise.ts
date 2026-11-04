import { useCallback, useState } from "react";
import { testRunService } from "../../services";
import type { NoiseAnalysisSkip } from "../../types";

type Enqueue = (
  message: string,
  options: { variant: "warning" | "error" },
) => unknown;

const skipMessage = ({ reason }: NoiseAnalysisSkip) =>
  reason === "queue full"
    ? "Queue is full, try again in a minute"
    : `Not analysed: ${reason}`;

export const useAnalyseNoise = (enqueue: Enqueue) => {
  const [requesting, setRequesting] = useState(false);

  const analyse = useCallback(
    async (ids: string[]): Promise<boolean> => {
      setRequesting(true);
      try {
        const { skipped } = await testRunService.analyseNoise(ids);
        if (skipped.length > 0) {
          enqueue(skipMessage(skipped[0]), { variant: "warning" });
        }
        return skipped.length === 0;
      } catch (err) {
        enqueue(String(err), { variant: "error" });
        return false;
      } finally {
        setRequesting(false);
      }
    },
    [enqueue],
  );

  return { analyse, requesting };
};
