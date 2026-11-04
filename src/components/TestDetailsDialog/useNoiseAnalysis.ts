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

// the run in the context is a Dto without regions once a socket event replaces it; the full result comes from GET /test-runs/:id
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
