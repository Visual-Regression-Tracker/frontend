import { Box, Chip, type SxProps, type Theme } from "@mui/material";
import { StatusChip } from "../StatusChip";
import {
  groupStatusSummary,
  type TestRunGroup,
} from "../../_helpers/testRunGroup.helper";
import { TEST_ID } from "../../constants/locators";

export const GroupCountChip = ({
  group,
  sx,
}: {
  group: TestRunGroup;
  sx?: SxProps<Theme>;
}) =>
  group.runs.length > 1 ? (
    <Chip
      size="small"
      label={group.runs.length}
      data-testid={TEST_ID.groupCount}
      sx={sx}
    />
  ) : null;

// the chip shows the representative only, so the title gives the whole group
export const GroupStatusChip = ({ group }: { group: TestRunGroup }) => (
  <Box component="span" title={groupStatusSummary(group.runs) || undefined}>
    <StatusChip status={group.representative.status} />
  </Box>
);
