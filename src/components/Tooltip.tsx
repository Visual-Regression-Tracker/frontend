import { Tooltip as MuiTooltip, TooltipProps } from "@material-ui/core";
import React from "react";

export const Tooltip: React.FunctionComponent<TooltipProps> = ({
    title, children
}) => {
    return (
        <MuiTooltip
            title={title}
            placement="bottom"
            arrow children={children as React.ReactElement} />
    );
};
