import { useEffect, useState } from "react";
import {
  isNoiseResult,
  type NoiseAnalysisValue,
} from "../../_helpers/noiseHint.helper";
import { hasRegions } from "../../_helpers/noiseRegions.helper";
import { testRunService } from "../../services";
import type { NoiseAnalysis, TestRun } from "../../types";

interface Loaded {
  runId: string;
  analysis: NoiseAnalysis;
}

// a socket event replaces the run with a Dto without regions, so fetch the full result
export function useNoiseAnalysis(
  testRun: Pick<TestRun, "id" | "noiseAnalysis">,
  enabled: boolean,
): NoiseAnalysisValue {
  const { id, noiseAnalysis: current } = testRun;
  const [loaded, setLoaded] = useState<Loaded>();

  const result = isNoiseResult(current) ? current : null;
  const computedAt = result?.computedAt;
  const needsRegions = enabled && !!result && !hasRegions(result);

  useEffect(() => {
    if (!needsRegions) {
      return;
    }
    let ignore = false;
    testRunService
      .getDetails(id)
      .then(({ noiseAnalysis }) => {
        if (
          !ignore &&
          isNoiseResult(noiseAnalysis) &&
          hasRegions(noiseAnalysis)
        ) {
          setLoaded({ runId: id, analysis: noiseAnalysis });
        }
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [id, computedAt, needsRegions]);

  if (
    needsRegions &&
    loaded?.runId === id &&
    loaded.analysis.computedAt === computedAt
  ) {
    return loaded.analysis;
  }
  return current;
}
