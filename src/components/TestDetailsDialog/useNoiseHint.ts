import { useState } from "react";
import { type HintStage, regionsOf } from "../../_helpers/noiseRegions.helper";
import type { TestRun } from "../../types";
import { useNoiseAnalysis } from "./useNoiseAnalysis";

export function useNoiseHint(
  testRun: Pick<TestRun, "id" | "noiseAnalysis">,
  enabled: boolean,
) {
  const analysis = useNoiseAnalysis(testRun, enabled);
  const [chosen, setChosen] = useState<{
    runId: string;
    stage: HintStage | null;
  }>();
  const stage = chosen?.runId === testRun.id ? chosen.stage : null;

  return {
    panelProps: {
      runId: testRun.id,
      analysis,
      stage,
      onStageChange: (next: HintStage | null) =>
        setChosen({ runId: testRun.id, stage: next }),
    },
    hintAreas: enabled && stage ? regionsOf(analysis, stage) : [],
  };
}
