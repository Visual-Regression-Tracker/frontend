import { Tooltip as MuiTooltip } from "@material-ui/core";
import React from "react";

export class Tooltip extends React.Component<any, any> {
    render() {
        return (
            <MuiTooltip
                title={this.props.title}
                placement="bottom"
                arrow children={this.props.children as React.ReactElement} />
        );
    }
}
