import { useEffect, useRef, useState } from "react";
import { Alert, alpha } from "@mui/material";
import { buildsService } from "../services";
import {
  useBuildState,
  useSelectedProject,
  useTestRunState,
} from "../contexts";
import {
  noiseAnalysisAvailable,
  noiseHintOf,
} from "../_helpers/noiseHint.helper";
import { rendererChangeText } from "../_helpers/noiseSummary.helper";
import type { NoiseSummary } from "../types/noiseAnalysis";

export const NoiseBanner = () => {
  const { selectedBuild } = useBuildState();
  const { testRuns } = useTestRunState();
  const available = noiseAnalysisAvailable(useSelectedProject());
  const buildId = selectedBuild?.id;
  const pending = testRuns.some((run) => noiseHintOf(run) === "pending");
  const [loaded, setLoaded] = useState<{
    buildId: string;
    summary: NoiseSummary;
  }>();
  const [revision, setRevision] = useState(0);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setRevision((current) => current + 1);
    }
    wasPending.current = pending;
  }, [pending]);

  useEffect(() => {
    if (!buildId || !available) {
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
  }, [buildId, available, revision]);

  const current = available && loaded?.buildId === buildId ? loaded : undefined;
  const text = current ? rendererChangeText(current.summary) : null;
  if (!text) {
    return null;
  }

  return (
    <Alert
      severity="info"
      data-testid="noise-banner"
      sx={(theme) => ({
        backgroundColor: alpha(theme.palette.info.main, 0.12),
      })}
    >
      {text}
    </Alert>
  );
};
