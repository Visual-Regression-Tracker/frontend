import React from "react";
import { Chip } from "@mui/material";
import { BuildStatus } from "../types/buildStatus";
import { statusColor } from "../theme";

// an unresolved build waits for a reviewer, so it is the one chip filled in
export const BuildStatusChip: React.FunctionComponent<{
  status: BuildStatus;
}> = ({ status }) => (
  <Chip
    variant={status === BuildStatus.unresolved ? "filled" : "outlined"}
    color={statusColor(status)}
    label={status}
    size="small"
  />
);
