import React from "react";
import { IconButton } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import {
  type GridRowId,
  useGridSlotComponentProps,
} from "@material-ui/data-grid";
import { usersService } from "../../services";
import { useSnackbar } from "notistack";
import { useUserDispatch, useUserState } from "../../contexts";
import { Tooltip } from "../Tooltip";

export const ActionButtons: React.FunctionComponent = () => {
  const props = useGridSlotComponentProps();
  const { enqueueSnackbar } = useSnackbar();
  const userDispatch = useUserDispatch();
  const { userList, user } = useUserState();

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
              const currentUserId = user?.id;
              if (currentUserId && ids.includes(currentUserId)) {
                enqueueSnackbar(`You cannot delete yourself.`, {
                  variant: "error",
                });
              } else {
                usersService
                  .remove(ids)
                  .then(() => {
                    enqueueSnackbar(`Removed`, {
                      variant: "success",
                    });
                    userDispatch({
                      type: "getAll",
                      payload: userList.filter(
                        (user) => !ids.includes(user.id)
                      ),
                    });
                  })
                  .catch((err) =>
                    enqueueSnackbar(err, {
                      variant: "error",
                    })
                  );
              }
            }}
          >
            <Delete />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
};
