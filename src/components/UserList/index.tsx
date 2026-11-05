import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Menu, MenuItem, Paper, Stack } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { DataGrid, GridRowSelectionModel } from "@mui/x-data-grid";
import { useSnackbar } from "notistack";
import { usersService } from "../../services";
import { Role, User } from "../../types";
import { useUserDispatch, useUserState } from "../../contexts";
import {
  ROLE_KEYS,
  filterUsers,
  recentGuests,
} from "../../_helpers/userList.helper";
import { FilterBar } from "../FilterBar";
import { SelectionBar } from "../SelectionBar";
import { GuestBanner } from "./GuestBanner";
import { RolesCard } from "./RolesCard";
import { buildColumns } from "./columns";

const ROLE_LABELS = Object.values(Role);
const GUEST_LABEL = Role.guest;

const UserList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const userDispatch = useUserDispatch();
  const { userList, user: currentUser } = useUserState();
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [roleMenu, setRoleMenu] = useState<HTMLElement | null>(null);

  const showError = useCallback(
    (err: string) => enqueueSnackbar(err, { variant: "error" }),
    [enqueueSnackbar],
  );

  useEffect(() => {
    usersService
      .getAll()
      .then((users) => userDispatch({ type: "getAll", payload: users }))
      .catch(showError);
  }, [userDispatch, showError]);

  const visible = useMemo(
    () => filterUsers(userList, search, roles),
    [userList, search, roles],
  );
  const selectable = useMemo(
    () => visible.filter((user) => user.id !== currentUser?.id),
    [visible, currentUser?.id],
  );
  const selectedUsers = useMemo(
    () => selectable.filter((user) => selection.has(user.id)),
    [selectable, selection],
  );
  const selectedIds = useMemo(
    () => selectedUsers.map(({ id }) => id),
    [selectedUsers],
  );
  const newGuests = useMemo(() => recentGuests(userList).length, [userList]);

  const changeRoles = useCallback(
    async (targets: User[], role: keyof typeof Role) => {
      const changing = targets.filter((target) => target.role !== role);
      const results = await Promise.allSettled(
        changing.map((target) => usersService.assignRole(target.id, role)),
      );
      userDispatch({
        type: "rolesChanged",
        payload: {
          ids: changing
            .filter((_, i) => results[i].status === "fulfilled")
            .map((target) => target.id),
          role,
        },
      });
      const failure = results.find((result) => result.status === "rejected");
      if (failure) {
        showError(failure.reason as string);
      } else if (changing.length > 0) {
        enqueueSnackbar("Updated", { variant: "success" });
      }
    },
    [userDispatch, enqueueSnackbar, showError],
  );

  const removeSelected = () =>
    usersService
      .remove(selectedIds)
      .then(() => {
        enqueueSnackbar("Removed", { variant: "success" });
        userDispatch({ type: "removed", payload: selectedIds });
        setSelection(new Set());
      })
      .catch(showError);

  const columns = useMemo(
    () =>
      buildColumns(currentUser?.id, (target, role) => {
        void changeRoles([target], role);
      }),
    [currentUser?.id, changeRoles],
  );

  const onSelectionChange = (model: GridRowSelectionModel) =>
    setSelection(
      new Set(
        model.type === "include"
          ? [...model.ids].map(String)
          : selectable.map(({ id }) => id).filter((id) => !model.ids.has(id)),
      ),
    );

  return (
    <Stack sx={{ flex: 1, minHeight: 0, gap: 2 }}>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchLabel="Search by name or email"
        filters={[
          {
            id: "role",
            label: "Role",
            options: ROLE_LABELS,
            value: roles,
            onChange: setRoles,
          },
        ]}
        onClear={() => {
          setSearch("");
          setRoles([]);
        }}
      />
      {newGuests > 0 && (
        <GuestBanner count={newGuests} onShow={() => setRoles([GUEST_LABEL])} />
      )}
      {selectedIds.length > 0 && (
        <SelectionBar
          selected={selectedIds.length}
          total={selectable.length}
          onSelectAll={() =>
            setSelection(new Set(selectable.map(({ id }) => id)))
          }
          onClose={() => setSelection(new Set())}
          actions={[
            {
              label: "Change role",
              onClick: (e) => setRoleMenu(e.currentTarget),
            },
            {
              label: "Delete",
              color: "error",
              icon: <Delete />,
              onClick: () => {
                void removeSelected();
              },
            },
          ]}
        />
      )}
      <Menu
        anchorEl={roleMenu}
        open={!!roleMenu}
        onClose={() => setRoleMenu(null)}
      >
        {ROLE_KEYS.map((key) => (
          <MenuItem
            key={key}
            onClick={() => {
              setRoleMenu(null);
              void changeRoles(selectedUsers, key);
            }}
          >
            {Role[key]}
          </MenuItem>
        ))}
      </Menu>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 250px" },
        }}
      >
        <Paper variant="outlined" sx={{ minHeight: 360, overflow: "hidden" }}>
          <DataGrid
            rows={visible}
            columns={columns}
            checkboxSelection
            disableColumnMenu
            disableRowSelectionOnClick
            isRowSelectable={({ id }) => String(id) !== currentUser?.id}
            rowSelectionModel={{ type: "include", ids: new Set(selectedIds) }}
            onRowSelectionModelChange={onSelectionChange}
          />
        </Paper>
        <RolesCard />
      </Box>
    </Stack>
  );
};

export default UserList;
