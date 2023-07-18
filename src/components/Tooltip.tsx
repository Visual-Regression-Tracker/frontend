import { Tooltip as MuiTooltip, type TooltipProps } from "@mui/material";
import React from "react";

export const Tooltip: React.FunctionComponent<TooltipProps> = ({
  title,
  children,
}) => {
  return (
    <MuiTooltip title={title} placement="bottom" arrow>
      {children}
    </MuiTooltip>
  );
};
