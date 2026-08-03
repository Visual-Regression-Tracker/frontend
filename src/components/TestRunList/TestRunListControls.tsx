import React from "react";
import {
  Box,
  Divider,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  DensityLarge,
  DensityMedium,
  DensitySmall,
  ViewList,
  ViewModule,
} from "@mui/icons-material";
import { Tooltip } from "../Tooltip";

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

const switchLabel = (text: string) => (
  <Typography variant="body2">{text}</Typography>
);

export const TestRunListControls: React.FunctionComponent<{
  view: TestRunView;
  onViewChange: (view: TestRunView) => void;
  density: TestRunDensity;
  onDensityChange: (density: TestRunDensity) => void;
  grouped: boolean;
  onGroupedChange: (grouped: boolean) => void;
  showDiff: boolean;
  onShowDiffChange: (showDiff: boolean) => void;
}> = ({
  view,
  onViewChange,
  density,
  onDensityChange,
  grouped,
  onGroupedChange,
  showDiff,
  onShowDiffChange,
}) => (
  <Box display="flex" alignItems="center" gap={1}>
    {/* laid out as a table or a grid */}
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
    <Divider
      orientation="vertical"
      flexItem
      sx={{ marginY: 1, marginX: 0.5 }}
    />
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
    <Divider
      orientation="vertical"
      flexItem
      sx={{ marginY: 1, marginX: 0.5 }}
    />
    {/* what the runs show; switches rather than icons, so "on" is unmistakable */}
    <Tooltip title="Collapse the runs of one screen that differ only by the axis the project groups by">
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={grouped}
            onChange={(event) => onGroupedChange(event.target.checked)}
            inputProps={{ "aria-label": "Group variations" }}
            data-testid="groupVariationsToggle"
          />
        }
        label={switchLabel("Group variations")}
        sx={{ marginLeft: 0, marginRight: 0 }}
      />
    </Tooltip>
    {/* only the cards carry a picture, so the table has nothing to swap */}
    {view === "grid" && (
      <Tooltip title="Toggle diff. Hotkey: D">
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showDiff}
              onChange={(event) => onShowDiffChange(event.target.checked)}
              inputProps={{ "aria-label": "Show diff" }}
              data-testid="showDiffToggle"
            />
          }
          label={switchLabel("Show diff")}
          sx={{ marginLeft: 0, marginRight: 0 }}
        />
      </Tooltip>
    )}
  </Box>
);
