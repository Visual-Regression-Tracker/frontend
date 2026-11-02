import { Box, GridLegacy as Grid, IconButton, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import { TestRun } from "../../types";
import TestStatusChip from "../TestStatusChip";

const headerSx = {
  position: "relative",
  textAlign: "left",
  bgcolor: "background.default",
  paddingLeft: "8px",
  paddingBottom: "8px",
} as const;
const testRunNameSx = { fontWeight: 300 } as const;
const closeIconSx = { position: "absolute", right: "8px" } as const;

interface TestDetailsHeaderProps {
  testRun: TestRun;
  currentRunIndex: number;
  totalTestRunCount: number;
  onClose: () => void;
}

export const TestDetailsHeader = ({
  testRun,
  currentRunIndex,
  totalTestRunCount,
  onClose,
}: TestDetailsHeaderProps) => (
  <Box mt={1} ml={1}>
    <Grid container alignItems="center" sx={headerSx} spacing={2}>
      <Grid item>
        <Typography variant="h6" display="inline">{`Step ${
          currentRunIndex + 1
        }/${totalTestRunCount}: `}</Typography>
        <Typography variant="h6" display="inline" sx={testRunNameSx}>
          {testRun.name}
        </Typography>
      </Grid>
      <Grid item>
        <TestStatusChip status={testRun.status} />
      </Grid>
      <Grid item sx={closeIconSx}>
        <IconButton color="inherit" onClick={onClose} size="large">
          <Close data-testid="CloseIcon" />
        </IconButton>
      </Grid>
    </Grid>
  </Box>
);
