import { Tooltip as MuiTooltip, TooltipProps } from "@mui/material";
import React from "react";

export const Tooltip: React.FunctionComponent<TooltipProps> = ({
  title,
  children,
}) => (
  <MuiTooltip title={title} placement="bottom" arrow>
    {children}
  </MuiTooltip>
);
