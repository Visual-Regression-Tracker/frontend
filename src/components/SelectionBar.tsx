import type { MouseEvent, ReactNode } from "react";
import { Button, IconButton, Stack, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";

export interface SelectionAction {
  label: string;
  icon?: ReactNode;
  color?: "primary" | "error";
  disabled?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

interface IProps {
  selected: number;
  total: number;
  actions: SelectionAction[];
  onSelectAll: () => void;
  onClose: () => void;
}

export const SelectionBar = ({
  selected,
  total,
  actions,
  onSelectAll,
  onClose,
}: IProps) => (
  <Stack
    direction="row"
    role="toolbar"
    aria-label="Selection"
    sx={{
      alignItems: "center",
      gap: 1,
      px: 1.5,
      py: 0.5,
      border: 1,
      borderColor: "divider",
      borderRadius: 1,
      bgcolor: "action.selected",
    }}
  >
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {selected} selected
    </Typography>
    {selected < total && (
      <Button size="small" onClick={onSelectAll}>
        Select all {total}
      </Button>
    )}
    <Stack direction="row" sx={{ gap: 1, ml: "auto" }}>
      {actions.map((action) => (
        <Button
          key={action.label}
          size="small"
          sx={{ whiteSpace: "nowrap" }}
          color={action.color}
          startIcon={action.icon}
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
    </Stack>
    <IconButton size="small" aria-label="Clear selection" onClick={onClose}>
      <Close fontSize="small" />
    </IconButton>
  </Stack>
);
