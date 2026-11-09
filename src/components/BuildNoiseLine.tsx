import { Stack, Typography } from "@mui/material";
import { BlurOn } from "@mui/icons-material";
import type { TestRun } from "../types";
import { TestStatus } from "../types/testStatus";
import { noiseHintOf } from "../_helpers/noiseHint.helper";
import { ANALYSING } from "../_helpers/noiseText.helper";
import { TEST_ID } from "../constants/locators";

interface IProps {
  testRuns: TestRun[];
}

export const BuildNoiseLine = ({ testRuns }: IProps) => {
  const unresolved = testRuns.filter(
    (run) => run.status === TestStatus.unresolved,
  );
  const pending = unresolved.filter(
    (run) => noiseHintOf(run) === "pending",
  ).length;
  if (pending === 0) {
    return null;
  }

  return (
    <Stack
      direction="row"
      data-testid={TEST_ID.buildNoiseLine}
      sx={{ alignItems: "center", gap: 0.75, color: "text.secondary" }}
    >
      <BlurOn fontSize="small" />
      <Typography variant="caption">
        {`${ANALYSING} ${pending} of ${unresolved.length}…`}
      </Typography>
    </Stack>
  );
};
