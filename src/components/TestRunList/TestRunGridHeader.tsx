import React from "react";
import { Box, Button, Checkbox, Typography } from "@mui/material";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";

// the grid sorts on its own: the table sorts by clicking its column headers, and
// diff size has no column there to click
export type TestRunSortField = "status" | "name" | "diff";

export type TestRunSort = {
  field: TestRunSortField;
  direction: "asc" | "desc";
};

export const SORT_LABELS: Record<TestRunSortField, string> = {
  name: "Name",
  status: "Status",
  diff: "Diff %",
};

// the direction a field is most useful in when it is first picked
export const DEFAULT_SORT_DIRECTION: Record<
  TestRunSortField,
  TestRunSort["direction"]
> = {
  status: "asc",
  name: "asc",
  diff: "desc",
};

export const DEFAULT_SORT: TestRunSort = { field: "status", direction: "asc" };

// picking the field already in use flips it, the way clicking a column header does
export const nextSort = (
  current: TestRunSort,
  field: TestRunSortField,
): TestRunSort =>
  current.field === field
    ? { field, direction: current.direction === "asc" ? "desc" : "asc" }
    : { field, direction: DEFAULT_SORT_DIRECTION[field] };

export const TestRunGridHeader: React.FunctionComponent<{
  sort: TestRunSort;
  onSortChange: (sort: TestRunSort) => void;
  selectedCount: number;
  totalCount: number;
  onToggleAll: () => void;
}> = ({ sort, onSortChange, selectedCount, totalCount, onToggleAll }) => {
  const Arrow = sort.direction === "asc" ? ArrowUpward : ArrowDownward;

  return (
    <Box
      display="flex"
      alignItems="center"
      paddingX={1}
      borderBottom={1}
      borderColor="divider"
    >
      <Checkbox
        size="small"
        checked={totalCount > 0 && selectedCount === totalCount}
        indeterminate={selectedCount > 0 && selectedCount < totalCount}
        onChange={onToggleAll}
        inputProps={{ "aria-label": "Select all runs" }}
        data-testid="gridSelectAll"
      />
      {(Object.keys(SORT_LABELS) as TestRunSortField[]).map((field) => (
        <Button
          key={field}
          size="small"
          color="inherit"
          onClick={() => onSortChange(nextSort(sort, field))}
          endIcon={
            field === sort.field ? <Arrow fontSize="small" /> : undefined
          }
          data-testid={`gridSort-${field}`}
          sx={{ textTransform: "none", fontWeight: 500 }}
        >
          {SORT_LABELS[field]}
        </Button>
      ))}
      {selectedCount > 0 && (
        <Typography
          variant="body2"
          marginLeft="auto"
          data-testid="gridSelectionCount"
        >
          {selectedCount} selected
        </Typography>
      )}
    </Box>
  );
};
