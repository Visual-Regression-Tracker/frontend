import React from "react";
import { Chip } from "@material-ui/core";
import { BuildStatus } from "../types/buildStatus";

export const BuildStatusChip: React.FunctionComponent<{
  status: BuildStatus;
}> = ({ status }) => {
  let color: "inherit" | "primary" | "secondary" | "default" | undefined;
  let variant: "default" | "outlined" | undefined;
  switch (status) {
    case BuildStatus.passed:
      color = "primary";
      variant = "outlined";
      break;
    case BuildStatus.unresolved:
      color = "secondary";
      break;
    case BuildStatus.failed:
      color = "secondary";
      variant = "outlined";
      break;
    default:
      color = undefined;
      variant = undefined;
  }
  return <Chip variant={variant} color={color} label={status} size="small" />;
};
