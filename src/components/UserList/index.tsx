import React from "react";
import { Box, Toolbar } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  type GridValueFormatterParams,
  type GridCellEditCommitParams,
} from "@mui/x-data-grid";
import { ActionButtons } from "./ActionButtons";
import { usersService } from "../../services";
import { Role } from "../../types";
import { useSnackbar } from "notistack";
import { useUserDispatch, useUserState } from "../../contexts";

const columnsDef: GridColDef[] = [
  { field: "id", hide: true, filterable: false },
  { field: "email", headerName: "Email", flex: 2 },
  { field: "firstName", headerName: "First name", flex: 1 },
  { field: "lastName", headerName: "Last name", flex: 1 },
  {
    field: "role",
    headerName: "Role",
    type: "singleSelect",
    editable: true,
    valueOptions: Object.entries(Role).map(([key, value]) => {
      return { value: key, label: value };
    }),
    renderCell: (params: GridValueFormatterParams) => {
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

  React.useEffect(() => {
    usersService
      .getAll()
      .then((users) => userDispatch({ type: "getAll", payload: users }));
  }, [userDispatch]);

  const handleEditCellChangeCommitted = React.useCallback(
    (params: GridCellEditCommitParams) => {
      const { id, field, value } = params;
      if (field === "role") {
        usersService
          .assignRole(id, value as Role)
          .then(() => {
            enqueueSnackbar("Updated", {
              variant: "success",
            });
          })
          .catch((err) =>
            enqueueSnackbar(err, {
              variant: "error",
            })
          );
      }
    },
    [enqueueSnackbar]
  );

  return (
    <DataGrid
      rows={userList}
      columns={columnsDef}
      checkboxSelection
      disableColumnMenu
      disableSelectionOnClick
      components={{
        Toolbar: DataGridCustomToolbar,
      }}
      onCellEditCommit={handleEditCellChangeCommitted}
    />
  );
};

export default UserList;

const DataGridCustomToolbar: React.FunctionComponent = () => {
  return (
    <Toolbar variant="dense">
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <Box marginLeft="auto">
        <ActionButtons />
      </Box>
    </Toolbar>
  );
};
