import { useState, type ReactNode } from "react";
import {
  Button,
  Checkbox,
  Chip,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";
import { DebouncedTextField } from "./DebouncedTextField";
import { filterChipId } from "../constants/locators";

interface FilterDef {
  id: string;
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

interface IProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel?: string;
  searchMinLength?: number;
  searchWidth?: number;
  searchTestId?: string;
  active?: boolean;
  actions?: ReactNode;
  filters: FilterDef[];
  onClear: () => void;
}

const FilterChip = ({ filter }: { filter: FilterDef }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const active = filter.value.length > 0;
  const toggle = (option: string) =>
    filter.onChange(
      filter.value.includes(option)
        ? filter.value.filter((value) => value !== option)
        : [...filter.value, option],
    );

  return (
    <>
      <Chip
        id={filterChipId(filter.id)}
        label={
          active ? `${filter.label}: ${filter.value.length}` : filter.label
        }
        color={active ? "primary" : "default"}
        variant={active ? "filled" : "outlined"}
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
      />
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { "aria-labelledby": filterChipId(filter.id) } }}
      >
        {filter.options.map((option) => (
          <MenuItem
            key={option}
            dense
            role="menuitemcheckbox"
            aria-checked={filter.value.includes(option)}
            onClick={() => toggle(option)}
          >
            <Checkbox
              size="small"
              edge="start"
              checked={filter.value.includes(option)}
              tabIndex={-1}
              disableRipple
            />
            <ListItemText primary={option} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export const FilterBar = ({
  search,
  onSearchChange,
  searchLabel = "Search",
  searchMinLength,
  searchWidth,
  searchTestId,
  active = false,
  actions,
  filters,
  onClear,
}: IProps) => {
  const visible = filters.filter((filter) => filter.options.length > 0);
  const filtering =
    active ||
    search !== "" ||
    filters.some((filter) => filter.value.length > 0);

  const bar = (
    <Stack
      direction="row"
      sx={{
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        ...(actions && { flex: 1, minWidth: 0 }),
      }}
    >
      <DebouncedTextField
        size="small"
        label={searchLabel}
        value={search}
        debounceTimeout={300}
        minLength={searchMinLength}
        onChange={onSearchChange}
        sx={searchWidth ? { width: searchWidth } : undefined}
        slotProps={
          searchTestId
            ? { htmlInput: { "data-testid": searchTestId } }
            : undefined
        }
      />
      {visible.map((filter) => (
        <FilterChip key={filter.id} filter={filter} />
      ))}
      {filtering && (
        <Button size="small" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </Stack>
  );

  if (!actions) {
    return bar;
  }
  return (
    <Stack direction="row" sx={{ alignItems: "flex-start", gap: 1 }}>
      {bar}
      <Stack
        direction="row"
        sx={{ alignItems: "center", gap: 1, flexShrink: 0, minHeight: 40 }}
      >
        {actions}
      </Stack>
    </Stack>
  );
};
