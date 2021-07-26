import React from "react";
import { Box, Toolbar } from "@material-ui/core";
import {
  DataGrid,
  GridColDef,
  GridEditCellPropsParams,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
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

  React.useEffect(() => {
    usersService.getList().then((users) => setUsers(users));
  }, []);

  const handleEditCellChangeCommitted = React.useCallback(
    (
      params: GridEditCellPropsParams,
      event?: React.ChangeEvent<{
        name?: string | undefined;
        value?: unknown;
      }>
    ) => {
      const { id, field, props } = params;
      if (field === "role") {
        const role = (props.value ?? event?.target.value) as Role;
        usersService
          .assignRole(id, role)
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
      rows={users}
      columns={columnsDef}
      disableColumnSelector
      disableColumnMenu
      components={{
        Toolbar: DataGridCustomToolbar,
      }}
      onEditCellChangeCommitted={handleEditCellChangeCommitted}
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
