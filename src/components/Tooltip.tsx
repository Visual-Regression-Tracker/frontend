import { Tooltip as MuiTooltip, TooltipProps } from "@mui/material";

// MUI labels the child with the title: a button wrapped in a span needs its own aria-label
export const Tooltip = ({
  title,
  children,
  describeChild,
}: Pick<TooltipProps, "title" | "children" | "describeChild">) => (
  <MuiTooltip
    title={title}
    placement="bottom"
    arrow
    describeChild={describeChild}
  >
    {children}
  </MuiTooltip>
);
