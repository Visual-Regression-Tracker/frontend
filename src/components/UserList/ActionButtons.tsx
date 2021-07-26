import React from "react";
import { IconButton, Tooltip } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { useGridSlotComponentProps } from "@material-ui/data-grid";
import { head } from "lodash";

export const ActionButtons: React.FunctionComponent = () => {
  const props = useGridSlotComponentProps();

  const selectedRow = React.useMemo(
    () => head(Object.keys(props.state.selection)) ?? "",
    [props.state.selection]
  );
  return (
    <>
      <Tooltip title="Delete selected rows." aria-label="delete">
        <span>
          <IconButton disabled={!selectedRow}>
            <Delete />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
};
