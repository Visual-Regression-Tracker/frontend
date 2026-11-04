import { Box, Button, Checkbox } from "@mui/material";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import type { TestRunSort, TestRunSortField } from "../../types/testRunSort";
import { TestRunDensity } from "./TestRunListControls";

const SORT_LABELS: Record<TestRunSortField, string> = {
  name: "Name",
  tags: "Tags",
  status: "Status",
  noise: "Noise",
};

const DEFAULT_SORT_DIRECTION: Record<
  TestRunSortField,
  TestRunSort["direction"]
> = {
  // descending status is needs-attention-first, as in the table
  status: "desc",
  name: "asc",
  tags: "asc",
  noise: "desc",
};

export const DEFAULT_SORT: TestRunSort = { field: "status", direction: "desc" };

const nextSort = (
  current: TestRunSort,
  field: TestRunSortField,
): TestRunSort =>
  current.field === field
    ? { field, direction: current.direction === "asc" ? "desc" : "asc" }
    : { field, direction: DEFAULT_SORT_DIRECTION[field] };

// measured off the data grid's header, so the views line up at every density
const HEADER_HEIGHT_BY_DENSITY: Record<TestRunDensity, number> = {
  compact: 39,
  standard: 56,
  comfortable: 72,
};

export const TestRunGridHeader = ({
  sort,
  onSortChange,
  density,
  noiseAvailable,
  selectedCount,
  totalCount,
  onToggleAll,
}: {
  sort: TestRunSort;
  onSortChange: (sort: TestRunSort) => void;
  density: TestRunDensity;
  noiseAvailable: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleAll: () => void;
}) => {
  const Arrow = sort.direction === "asc" ? ArrowUpward : ArrowDownward;

  // the table's column widths; textAlign is explicit as body centres text globally
  const label = (field: TestRunSortField, flex: number) => (
    <Box sx={{ flex, minWidth: 0, textAlign: "left" }}>
      <Button
        size="small"
        color="inherit"
        onClick={() => onSortChange(nextSort(sort, field))}
        endIcon={field === sort.field ? <Arrow fontSize="small" /> : undefined}
        data-testid={`gridSort-${field}`}
        sx={{ textTransform: "none", fontSize: 14, fontWeight: 500 }}
      >
        {SORT_LABELS[field]}
      </Button>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        height: HEADER_HEIGHT_BY_DENSITY[density],
        flexShrink: 0,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ width: 50, display: "flex", justifyContent: "center" }}>
        <Checkbox
          size="small"
          checked={totalCount > 0 && selectedCount === totalCount}
          indeterminate={selectedCount > 0 && selectedCount < totalCount}
          onChange={onToggleAll}
          data-testid="gridSelectAll"
          slotProps={{
            input: { "aria-label": "Select all runs" },
          }}
        />
      </Box>
      {label("name", 1)}
      {label("tags", 1)}
      {label("status", 0.3)}
      {noiseAvailable && label("noise", 0.3)}
    </Box>
  );
};
