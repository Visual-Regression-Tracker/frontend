import { Tooltip as MuiTooltip, TooltipProps } from "@mui/material";

// MUI labels the child with the title: a button wrapped in a span needs its own aria-label
export const Tooltip = ({
  title,
  children,
}: Pick<TooltipProps, "title" | "children">) => (
  <MuiTooltip title={title} placement="bottom" arrow>
    {children}
  </MuiTooltip>
);
