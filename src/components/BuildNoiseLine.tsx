import { Button, Stack, Typography } from "@mui/material";
import { BlurOn } from "@mui/icons-material";
import type { TestRun } from "../types";
import { TestStatus } from "../types/testStatus";
import { noiseHintOf } from "../_helpers/noiseHint.helper";
import { buildNoiseCaption } from "../_helpers/noiseSummary.helper";
import { ANALYSING } from "../_helpers/noiseText.helper";

interface IProps {
  testRuns: TestRun[];
  onShowNoise: () => void;
}

export const BuildNoiseLine = ({ testRuns, onShowNoise }: IProps) => {
  const unresolved = testRuns.filter(
    (run) => run.status === TestStatus.unresolved,
  );
  const pending = unresolved.filter((run) => noiseHintOf(run) === "pending");
  const caption = buildNoiseCaption(testRuns);
  if (!caption) {
    return null;
  }

  return (
    <Stack
      direction="row"
      data-testid="build-noise-line"
      sx={{ alignItems: "center", gap: 0.75, color: "text.secondary" }}
    >
      <BlurOn fontSize="small" />
      {pending.length > 0 ? (
        <Typography variant="caption">
          {`${ANALYSING} ${pending.length} of ${unresolved.length}…`}
        </Typography>
      ) : (
        <>
          <Typography variant="caption">{caption}</Typography>
          <Button size="small" onClick={onShowNoise}>
            Show them
          </Button>
        </>
      )}
    </Stack>
  );
};
