import { Grid, IconButton, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import { TestRun } from "../../types";
import { StatusChip } from "../StatusChip";

const headerSx = {
  alignItems: "center",
  position: "relative",
  textAlign: "left",
  bgcolor: "background.default",
  pt: 1,
  pl: 2,
  pb: 1,
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
  <Grid container spacing={2} sx={headerSx}>
    <Grid>
      <Typography
        variant="h6"
        sx={{ display: "inline" }}
      >{`Step ${currentRunIndex + 1}/${totalTestRunCount}: `}</Typography>
      <Typography variant="h6" sx={{ display: "inline", ...testRunNameSx }}>
        {testRun.name}
      </Typography>
    </Grid>
    <Grid>
      <StatusChip status={testRun.status} />
    </Grid>
    <Grid sx={closeIconSx}>
      <IconButton color="inherit" onClick={onClose} size="large">
        <Close data-testid="CloseIcon" />
      </IconButton>
    </Grid>
  </Grid>
);
