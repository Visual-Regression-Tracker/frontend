import { Tooltip as MuiTooltip, TooltipProps } from "@mui/material";

export const Tooltip = ({ title, children }: TooltipProps) => (
  <MuiTooltip title={title} placement="bottom" arrow>
    {children}
  </MuiTooltip>
);
