import React from "react";
import { IconButton, Tooltip } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { GridRowId, useGridSlotComponentProps } from "@material-ui/data-grid";
import { usersService } from "../../services";
import { useSnackbar } from "notistack";

export const ActionButtons: React.FunctionComponent = () => {
  const props = useGridSlotComponentProps();
  const { enqueueSnackbar } = useSnackbar();

  const ids: GridRowId[] = React.useMemo(
    () => Object.values(props.state.selection),
    [props.state.selection]
  );
  return (
    <>
      <Tooltip title="Delete selected rows." aria-label="delete">
        <span>
          <IconButton
            disabled={!ids.length}
            onClick={() => {
              usersService
                .remove(ids)
                .then(() => {
                  enqueueSnackbar(`Removed`, {
                    variant: "success",
                  });
                })
                .catch((err) =>
                  enqueueSnackbar(err, {
                    variant: "error",
                  })
                );
            }}
          >
            <Delete />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
};
