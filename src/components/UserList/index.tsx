import { useCallback, useEffect } from "react";
import { Box, Toolbar } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { ActionButtons } from "./ActionButtons";
import { usersService } from "../../services";
import { Role, User } from "../../types";
import { useSnackbar } from "notistack";
import { useUserDispatch, useUserState } from "../../contexts";

const columnsDef: GridColDef[] = [
  {
    field: "id",
    filterable: false,
  },
  {
    field: "email",
    headerName: "Email",
    flex: 2,
  },
  {
    field: "firstName",
    headerName: "First name",
    flex: 1,
  },
  {
    field: "lastName",
    headerName: "Last name",
    flex: 1,
  },
  {
    field: "role",
    headerName: "Role",
    type: "singleSelect",
    editable: true,
    valueOptions: Object.entries(Role).map(([key, value]) => ({
      value: key,
      label: value,
    })),
    renderCell: (params: GridRenderCellParams) => {
      const role = params.value as keyof typeof Role;
      return Role[role];
    },
    flex: 1,
  },
];

const UserList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const userDispatch = useUserDispatch();
  const { userList } = useUserState();

  useEffect(() => {
    usersService
      .getAll()
      .then((users) =>
        userDispatch({
          type: "getAll",
          payload: users,
        }),
      )
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
  }, [userDispatch, enqueueSnackbar]);

  // the grid shows the row this resolves to, so a rejected role reverts
  const processRowUpdate = useCallback(
    (newState: User, oldState: User) => {
      if (newState.role === oldState.role) {
        return newState;
      }
      return usersService
        .assignRole(oldState.id, newState.role as Role)
        .then(() => {
          enqueueSnackbar("Updated", {
            variant: "success",
          });
          return newState;
        })
        .catch((err) => {
          enqueueSnackbar(err, {
            variant: "error",
          });
          return oldState;
        });
    },
    [enqueueSnackbar],
  );

  return (
    <DataGrid
      rows={userList}
      columns={columnsDef}
      columnVisibilityModel={{
        id: false,
      }}
      checkboxSelection
      disableColumnMenu
      disableRowSelectionOnClick
      showToolbar
      slots={{
        toolbar: DataGridCustomToolbar,
      }}
      processRowUpdate={processRowUpdate}
    />
  );
};

export default UserList;

const DataGridCustomToolbar = () => (
  <Toolbar variant="dense">
    <GridToolbarFilterButton />
    <GridToolbarDensitySelector />
    <Box marginLeft="auto">
      <ActionButtons />
    </Box>
  </Toolbar>
);
