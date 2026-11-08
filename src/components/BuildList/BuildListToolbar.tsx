import { Box, Checkbox } from "@mui/material";
import { DebouncedTextField } from "../DebouncedTextField";
import { Tooltip } from "../Tooltip";

export const BuildListToolbar = ({
  selectAllLabel,
  allSelected,
  someSelected,
  selectAllDisabled,
  onToggleSelectAll,
  searchQuery,
  onSearchChange,
}: {
  selectAllLabel: string;
  allSelected: boolean;
  someSelected: boolean;
  selectAllDisabled: boolean;
  onToggleSelectAll: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) => (
  <Box sx={{ padding: 1, display: "flex", alignItems: "center" }}>
    {/* kept mounted so an empty search does not shift the search field */}
    <Tooltip title={selectAllLabel}>
      <span>
        <Checkbox
          size="small"
          checked={allSelected}
          indeterminate={someSelected}
          disabled={selectAllDisabled}
          onChange={onToggleSelectAll}
          data-testid="buildSelectAll"
          slotProps={{
            input: { "aria-label": selectAllLabel },
          }}
        />
      </span>
    </Tooltip>
    <Box sx={{ flexGrow: 1 }}>
      <DebouncedTextField
        size="small"
        variant="outlined"
        fullWidth
        label="CI build id"
        placeholder="Search by CI build id"
        value={searchQuery}
        debounceTimeout={300}
        onChange={onSearchChange}
        slotProps={{
          htmlInput: {
            "data-testid": "buildSearch",
            autoComplete: "off",
          },
        }}
      />
    </Box>
  </Box>
);
