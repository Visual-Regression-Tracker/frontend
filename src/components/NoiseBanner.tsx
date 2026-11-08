import { useEffect, useMemo, useState } from "react";
import { Alert } from "@mui/material";
import { buildsService } from "../services";
import { useBuildState, useTestRunState } from "../contexts";
import { noiseHintOf } from "../_helpers/noiseHint.helper";
import { rendererChangeText } from "../_helpers/noiseSummary.helper";
import type { NoiseSummary } from "../types/noiseAnalysis";
import { TEST_ID } from "../constants/locators";

export const NoiseBanner = () => {
  const { selectedBuild } = useBuildState();
  const { testRuns } = useTestRunState();
  const buildId = selectedBuild?.id;
  const pending = useMemo(
    () => testRuns.some((run) => noiseHintOf(run) === "pending"),
    [testRuns],
  );
  const [loaded, setLoaded] = useState<{
    buildId: string;
    summary: NoiseSummary;
  }>();

  useEffect(() => {
    if (!buildId || pending) {
      return;
    }
    let ignore = false;
    buildsService
      .getNoiseSummary(buildId)
      .then((result) => {
        if (!ignore) {
          setLoaded({ buildId, summary: result });
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [buildId, pending]);

  const current = loaded?.buildId === buildId ? loaded : undefined;
  const text = current ? rendererChangeText(current.summary) : null;
  if (!text) {
    return null;
  }

  return (
    <Alert
      severity="info"
      data-testid={TEST_ID.noiseBanner}
      sx={(theme) => ({
        backgroundColor: `rgba(${theme.vars?.palette.info.mainChannel} / 0.12)`,
      })}
    >
      {text}
    </Alert>
  );
};
