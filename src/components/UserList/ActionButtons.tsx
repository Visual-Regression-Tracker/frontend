import React from "react";
import { IconButton } from "@mui/material";
import { Delete } from "@mui/icons-material";
import {
  GridRowId,
  useGridApiContext,
  gridRowSelectionStateSelector,
} from "@mui/x-data-grid";
import { usersService } from "../../services";
import { useSnackbar } from "notistack";
import { useUserDispatch, useUserState } from "../../contexts";
import { Tooltip } from "../Tooltip";

export const ActionButtons: React.FunctionComponent = () => {
  const apiRef = useGridApiContext();
  const { state } = apiRef.current;
  const selection = gridRowSelectionStateSelector(state);

  const { enqueueSnackbar } = useSnackbar();
  const userDispatch = useUserDispatch();
  const { userList, user } = useUserState();

  const ids: GridRowId[] = React.useMemo(
    () => Object.values(selection),
    [selection],
  );

  return (
    <React.Fragment>
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
                        (user) => !ids.includes(user.id),
                      ),
                    });
                  })
                  .catch((err) =>
                    enqueueSnackbar(err, {
                      variant: "error",
                    }),
                  );
              }
            }}
            size="large"
          >
            <Delete />
          </IconButton>
        </span>
      </Tooltip>
    </React.Fragment>
  );
};
