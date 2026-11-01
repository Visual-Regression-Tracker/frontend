import { Chip } from "@mui/material";
import { BuildStatus } from "../types/buildStatus";
import { statusColor } from "../theme";

export const BuildStatusChip = ({ status }: { status: BuildStatus }) => (
  <Chip
    variant={status === BuildStatus.unresolved ? "filled" : "outlined"}
    color={statusColor(status)}
    label={status}
    size="small"
  />
);
