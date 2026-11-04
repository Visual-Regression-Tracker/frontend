import { useMemo } from "react";
import { Button } from "@mui/material";
import { useSnackbar } from "notistack";
import { TestRun, TestStatus } from "../../types";
import { noiseHintOf } from "../../_helpers/noiseHint.helper";
import { useAnalyseNoise } from "./useAnalyseNoise";

export const AnalyseNoiseButton = ({ runs }: { runs: TestRun[] }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { analyse, requesting } = useAnalyseNoise(enqueueSnackbar);

  const unresolvedIds = useMemo(
    () =>
      runs
        .filter((run) => run.status === TestStatus.unresolved)
        .map((run) => run.id),
    [runs],
  );
  const pending = useMemo(
    () => runs.filter((run) => noiseHintOf(run) === "pending").length,
    [runs],
  );

  return (
    <Button
      variant="outlined"
      size="small"
      data-testid="analyse-noise-button"
      disabled={requesting || pending > 0 || unresolvedIds.length === 0}
      onClick={() => void analyse(unresolvedIds)}
    >
      {pending > 0
        ? `analysing ${pending} of ${unresolvedIds.length}…`
        : `Analyse unresolved (${unresolvedIds.length})`}
    </Button>
  );
};
