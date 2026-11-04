import { useState } from "react";
import { Button } from "@mui/material";
import { useSnackbar } from "notistack";
import { testRunService } from "../../services";
import { TestRun, TestStatus } from "../../types";
import { noiseHintOf } from "../../_helpers/noiseHint.helper";

export const AnalyseNoiseButton = ({ runs }: { runs: TestRun[] }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [requesting, setRequesting] = useState(false);

  const unresolvedIds = runs
    .filter((run) => run.status === TestStatus.unresolved)
    .map((run) => run.id);
  const pending = runs.filter((run) => noiseHintOf(run) === "pending").length;

  const analyse = () => {
    setRequesting(true);
    testRunService
      .analyseNoise(unresolvedIds)
      .then(({ skipped }) => {
        if (skipped.some(({ reason }) => reason === "queue full")) {
          enqueueSnackbar("Queue is full, try again in a minute", {
            variant: "warning",
          });
        }
      })
      .catch((err: string) => {
        enqueueSnackbar(err, { variant: "error" });
      })
      .finally(() => setRequesting(false));
  };

  return (
    <Button
      variant="outlined"
      size="small"
      data-testid="analyse-noise-button"
      disabled={requesting || pending > 0 || unresolvedIds.length === 0}
      onClick={analyse}
    >
      {pending > 0
        ? `analysing ${pending} of ${unresolvedIds.length}…`
        : `Analyse unresolved (${unresolvedIds.length})`}
    </Button>
  );
};
