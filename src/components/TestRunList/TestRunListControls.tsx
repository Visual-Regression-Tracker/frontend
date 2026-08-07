import React from "react";
import {
  Box,
  Divider,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip as MuiTooltip,
  TooltipProps,
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
import { GroupByAxis } from "../../_helpers/testRunGroup.helper";

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

const groupDivider = (
  <Divider orientation="vertical" flexItem sx={{ marginY: 1, marginX: 0.5 }} />
);

/**
 * A toggle button with a tooltip that appears at once. Two traps live here:
 * the app's Tooltip wrapper forwards only title and children, so the props the
 * group hands down would vanish, and ToggleButtonGroup reads `value` off its
 * direct child to decide which button is selected. Hence MUI's tooltip, the
 * rest spread through it, and the value on both.
 */
type IconToggleProps = {
  value: string;
  title: string;
  ariaLabel: string;
  testId: string;
  icon: React.ReactNode;
} & Omit<TooltipProps, "title" | "children">;

const IconToggle: React.FunctionComponent<IconToggleProps> = ({
  value,
  title,
  ariaLabel,
  testId,
  icon,
  ...rest
}) => (
  <MuiTooltip title={title} placement="bottom" arrow {...rest}>
    <ToggleButton value={value} aria-label={ariaLabel} data-testid={testId}>
      {icon}
    </ToggleButton>
  </MuiTooltip>
);

export const TestRunListControls: React.FunctionComponent<{
  view: TestRunView;
  onViewChange: (view: TestRunView) => void;
  density: TestRunDensity;
  onDensityChange: (density: TestRunDensity) => void;
  grouped: boolean;
  onGroupedChange: (grouped: boolean) => void;
  groupByAxis: GroupByAxis;
  showDiff: boolean;
  onShowDiffChange: (showDiff: boolean) => void;
}> = ({
  view,
  onViewChange,
  density,
  onDensityChange,
  grouped,
  onGroupedChange,
  groupByAxis,
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
      <IconToggle
        value="table"
        title="Table"
        ariaLabel="Table view"
        testId="tableViewToggle"
        icon={<ViewList fontSize="small" />}
      />
      <IconToggle
        value="grid"
        title="Grid"
        ariaLabel="Grid view"
        testId="gridViewToggle"
        icon={<ViewModule fontSize="small" />}
      />
    </ToggleButtonGroup>
    {groupDivider}
    <ToggleButtonGroup
      exclusive
      size="small"
      value={density}
      onChange={(event, next: TestRunDensity | null) =>
        next && onDensityChange(next)
      }
    >
      <IconToggle
        value="compact"
        title="Compact"
        ariaLabel="Compact density"
        testId="compactDensity"
        icon={<DensitySmall fontSize="small" />}
      />
      <IconToggle
        value="standard"
        title="Standard"
        ariaLabel="Standard density"
        testId="standardDensity"
        icon={<DensityMedium fontSize="small" />}
      />
      <IconToggle
        value="comfortable"
        title="Comfortable"
        ariaLabel="Comfortable density"
        testId="comfortableDensity"
        icon={<DensityLarge fontSize="small" />}
      />
    </ToggleButtonGroup>
    {groupDivider}
    {/* what the runs show; switches rather than icons, so "on" is unmistakable.
        The axis is named in the tooltip and not chosen here: it is a project
        setting shared by everyone, and the details dialog groups by the same
        one, so a selector in the toolbar would let the two drift apart */}
    <Tooltip
      title={
        // a node rather than a string, because the wrapper forwards only title
        // and children, so the line breaks cannot come from a style
        <React.Fragment>
          Collapses a screen&apos;s variations into one{" "}
          {view === "grid" ? "card" : "row"} by group.
          <br />
          Set it in Projects → Edit the project → &quot;Group variations
          by&quot;.
          <br />
          Current axis: {groupByAxis}.
        </React.Fragment>
      }
    >
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
    {view === "grid" && groupDivider}
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
