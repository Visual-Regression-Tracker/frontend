import React from "react";
import { IconButton, Tooltip } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { GridRowId, useGridSlotComponentProps } from "@material-ui/data-grid";
import { usersService } from "../../services";
import { useSnackbar } from "notistack";
import { useUserDispatch, useUserState } from "../../contexts";

export const ActionButtons: React.FunctionComponent = () => {
  const props = useGridSlotComponentProps();
  const { enqueueSnackbar } = useSnackbar();
  const userDispatch = useUserDispatch();
  const { userList } = useUserState();

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
                .then((value) => {
                  if (value.toString().trim().length === 0) {
                    enqueueSnackbar(`Removed`, {
                      variant: "success",
                    });
                    userDispatch({
                      type: "getAll",
                      payload: userList.filter((user) => !ids.includes(user.id)),
                    });
                  } else {
                    enqueueSnackbar(`You cannot delete yourself.`, {
                      variant: "error",
                    });
                  }
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
