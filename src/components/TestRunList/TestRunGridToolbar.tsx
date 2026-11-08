import { Button, Checkbox, Stack, Typography } from "@mui/material";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import type { TestRunSort, TestRunSortField } from "../../types/testRunSort";

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

export const TestRunGridToolbar = ({
  sort,
  onSortChange,
  noiseAvailable,
  selectedCount,
  totalCount,
  onToggleAll,
}: {
  sort: TestRunSort;
  onSortChange: (sort: TestRunSort) => void;
  noiseAvailable: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleAll: () => void;
}) => {
  const Arrow = sort.direction === "asc" ? ArrowUpward : ArrowDownward;
  const fields = (Object.keys(SORT_LABELS) as TestRunSortField[]).filter(
    (field) => field !== "noise" || noiseAvailable,
  );

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: 1,
        paddingX: 1.5,
        paddingY: 0.5,
        flexShrink: 0,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
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
      <Typography
        id="grid-sort-label"
        variant="body2"
        sx={{ color: "text.secondary", marginLeft: "auto" }}
      >
        Sort by
      </Typography>
      <Stack
        direction="row"
        role="group"
        aria-labelledby="grid-sort-label"
        sx={{ gap: 0.5 }}
      >
        {fields.map((field) => (
          <Button
            key={field}
            size="small"
            color="inherit"
            onClick={() => onSortChange(nextSort(sort, field))}
            endIcon={
              field === sort.field ? <Arrow fontSize="small" /> : undefined
            }
            data-testid={`gridSort-${field}`}
            sx={{ textTransform: "none", fontSize: 14, fontWeight: 500 }}
          >
            {SORT_LABELS[field]}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
};
