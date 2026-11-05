import {
  Avatar,
  Chip,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DateLabel } from "../DateLabel";
import { ROLE_KEYS, fullName, initials } from "../../_helpers/userList.helper";
import { Role, User } from "../../types";

export const buildColumns = (
  currentUserId: string | undefined,
  onRoleChange: (user: User, role: keyof typeof Role) => void,
): GridColDef<User>[] => [
  {
    field: "person",
    headerName: "Person",
    flex: 2,
    minWidth: 240,
    display: "flex",
    valueGetter: (_value, row) => fullName(row),
    renderCell: ({ row }: GridRenderCellParams<User>) => (
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
          {initials(row)}
        </Avatar>
        <div>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {fullName(row)}
            </Typography>
            {row.id === currentUserId && (
              <Chip size="small" variant="outlined" label="you" />
            )}
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {row.email}
          </Typography>
        </div>
      </Stack>
    ),
  },
  {
    field: "role",
    headerName: "Role",
    flex: 1,
    minWidth: 140,
    display: "flex",
    valueGetter: (_value, row) => Role[row.role],
    renderCell: ({ row }: GridRenderCellParams<User>) => (
      <Select
        size="small"
        value={row.role}
        onChange={(event) => onRoleChange(row, event.target.value)}
        inputProps={{ "aria-label": `Role of ${fullName(row)}` }}
        sx={{
          minWidth: 112,
          color: row.role === "guest" ? "warning.main" : undefined,
        }}
      >
        {ROLE_KEYS.map((key) => (
          <MenuItem key={key} value={key}>
            {Role[key]}
          </MenuItem>
        ))}
      </Select>
    ),
  },
  {
    field: "createdAt",
    headerName: "Joined",
    flex: 1,
    minWidth: 110,
    renderCell: ({ row }: GridRenderCellParams<User>) =>
      row.createdAt ? <DateLabel date={row.createdAt} /> : null,
  },
];
