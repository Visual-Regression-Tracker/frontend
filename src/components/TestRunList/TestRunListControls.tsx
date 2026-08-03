import React from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import {
  Collections,
  DensityLarge,
  DensityMedium,
  DensitySmall,
  ViewList,
  ViewModule,
} from "@mui/icons-material";

export type TestRunView = "table" | "grid";

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
}> = ({
  view,
  onViewChange,
  density,
  onDensityChange,
  grouped,
  onGroupedChange,
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
  </Box>
);
