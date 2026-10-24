import React from "react";
import { Chip } from "@mui/material";
import { statusColor } from "../theme";

const TestStatusChip: React.FunctionComponent<{
  status: string | undefined;
}> = ({ status }) => (
  <Chip
    variant="outlined"
    color={statusColor(status)}
    label={status}
    size="small"
  />
);

export default TestStatusChip;
