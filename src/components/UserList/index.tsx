import React from "react";
import { Box, Toolbar } from "@material-ui/core";
import {
  DataGrid,
  GridColDef,
  GridEditCellPropsParams,
  GridEditRowModelParams,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridEditRowsModel,
  GridValueFormatterParams,
} from "@material-ui/data-grid";
import { ActionButtons } from "./ActionButtons";
import { usersService } from "../../services";
import { Role, User } from "../../types";
import { useSnackbar } from "notistack";

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
  const [users, setUsers] = React.useState<User[]>([]);
  const [editRowsModel, setEditRowsModel] = React.useState<GridEditRowsModel>(
    {}
  );

  React.useEffect(() => {
    usersService.getAll().then((users) => setUsers(users));
  }, []);

  const handleEditRowModelChange = React.useCallback(
    (params: GridEditRowModelParams) => {
      setEditRowsModel(params.model);
    },
    []
  );

  const handleEditCellChangeCommitted = React.useCallback(
    (params: GridEditCellPropsParams) => {
      const { id, field } = params;
      const value = editRowsModel[id][field].value;
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
    [enqueueSnackbar, editRowsModel]
  );

  return (
    <DataGrid
      rows={users}
      columns={columnsDef}
      checkboxSelection
      disableColumnMenu
      disableSelectionOnClick
      components={{
        Toolbar: DataGridCustomToolbar,
      }}
      onEditCellChangeCommitted={handleEditCellChangeCommitted}
      editRowsModel={editRowsModel}
      onEditRowModelChange={handleEditRowModelChange}
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
