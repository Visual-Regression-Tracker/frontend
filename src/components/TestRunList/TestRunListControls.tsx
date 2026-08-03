import React from "react";
import {
  Box,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  ArrowDownward,
  ArrowUpward,
  Collections,
  DensityLarge,
  DensityMedium,
  DensitySmall,
  ViewList,
  ViewModule,
} from "@mui/icons-material";

export type TestRunView = "table" | "grid";

// the grid sorts on its own: the table sorts by clicking its column headers, and
// diff size has no column there to click
export type TestRunSortField = "status" | "name" | "diff";

export type TestRunSort = {
  field: TestRunSortField;
  direction: "asc" | "desc";
};

export const SORT_LABELS: Record<TestRunSortField, string> = {
  status: "Status",
  name: "Name",
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

// the data grid's own density values, so it can take this straight as a prop
export type TestRunDensity = "compact" | "standard" | "comfortable";

export const CARD_SIZE_BY_DENSITY: Record<
  TestRunDensity,
  { width: number; imageHeight: number }
> = {
  compact: { width: 150, imageHeight: 110 },
  standard: { width: 220, imageHeight: 160 },
  comfortable: { width: 320, imageHeight: 240 },
};

export const TestRunListControls: React.FunctionComponent<{
  view: TestRunView;
  onViewChange: (view: TestRunView) => void;
  density: TestRunDensity;
  onDensityChange: (density: TestRunDensity) => void;
  grouped: boolean;
  onGroupedChange: (grouped: boolean) => void;
  sort: TestRunSort;
  onSortChange: (sort: TestRunSort) => void;
}> = ({
  view,
  onViewChange,
  density,
  onDensityChange,
  grouped,
  onGroupedChange,
  sort,
  onSortChange,
}) => (
  <Box display="flex" alignItems="center" gap={1}>
    <ToggleButtonGroup
      exclusive
      size="small"
      value={view}
      onChange={(event, next: TestRunView | null) => next && onViewChange(next)}
    >
      <ToggleButton
        title="Table"
        value="table"
        aria-label="Table view"
        data-testid="tableViewToggle"
      >
        <ViewList fontSize="small" />
      </ToggleButton>
      <ToggleButton
        title="Grid"
        value="grid"
        aria-label="Grid view"
        data-testid="gridViewToggle"
      >
        <ViewModule fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
    <ToggleButtonGroup
      exclusive
      size="small"
      value={density}
      onChange={(event, next: TestRunDensity | null) =>
        next && onDensityChange(next)
      }
    >
      <ToggleButton
        title="Compact"
        value="compact"
        aria-label="Compact density"
        data-testid="compactDensity"
      >
        <DensitySmall fontSize="small" />
      </ToggleButton>
      <ToggleButton
        title="Standard"
        value="standard"
        aria-label="Standard density"
        data-testid="standardDensity"
      >
        <DensityMedium fontSize="small" />
      </ToggleButton>
      <ToggleButton
        title="Comfortable"
        value="comfortable"
        aria-label="Comfortable density"
        data-testid="comfortableDensity"
      >
        <DensityLarge fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
    {/* the table stays one row per run, so grouping only applies to the grid */}
    {view === "grid" && (
      <ToggleButton
        size="small"
        title="Group variations"
        value="grouped"
        selected={grouped}
        onChange={() => onGroupedChange(!grouped)}
        aria-label="Group variations"
        data-testid="groupVariationsToggle"
      >
        <Collections fontSize="small" />
      </ToggleButton>
    )}
    {view === "grid" && (
      <GridSortMenu sort={sort} onSortChange={onSortChange} />
    )}
  </Box>
);

const GridSortMenu: React.FunctionComponent<{
  sort: TestRunSort;
  onSortChange: (sort: TestRunSort) => void;
}> = ({ sort, onSortChange }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const Arrow = sort.direction === "asc" ? ArrowUpward : ArrowDownward;

  return (
    <>
      <IconButton
        size="small"
        title={`Sorted by ${SORT_LABELS[sort.field]}, ${
          sort.direction === "asc" ? "ascending" : "descending"
        }`}
        aria-label="Sort cards"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        data-testid="gridSort"
      >
        <Arrow fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        {(Object.keys(SORT_LABELS) as TestRunSortField[]).map((field) => (
          <MenuItem
            key={field}
            selected={field === sort.field}
            onClick={() => {
              onSortChange(nextSort(sort, field));
              setAnchorEl(null);
            }}
          >
            <ListItemText>{SORT_LABELS[field]}</ListItemText>
            {field === sort.field && (
              <Arrow fontSize="small" sx={{ marginLeft: 1 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
