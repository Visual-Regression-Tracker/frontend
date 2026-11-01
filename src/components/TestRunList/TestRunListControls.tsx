import { Fragment, type ReactNode } from "react";
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

// MUI's tooltip, as the app's wrapper drops props; `value` must sit on the child
type IconToggleProps = {
  value: string;
  title: string;
  ariaLabel: string;
  testId: string;
  icon: ReactNode;
} & Omit<TooltipProps, "title" | "children">;

const IconToggle = ({
  value,
  title,
  ariaLabel,
  testId,
  icon,
  ...rest
}: IconToggleProps) => (
  // not interactive, or it would swallow clicks on the sort buttons under it
  <MuiTooltip
    title={title}
    placement="bottom"
    arrow
    disableInteractive
    {...rest}
  >
    <ToggleButton value={value} aria-label={ariaLabel} data-testid={testId}>
      {icon}
    </ToggleButton>
  </MuiTooltip>
);

export const TestRunListControls = ({
  view,
  onViewChange,
  density,
  onDensityChange,
  grouped,
  onGroupedChange,
  groupByAxis,
  showDiff,
  onShowDiffChange,
}: {
  view: TestRunView;
  onViewChange: (view: TestRunView) => void;
  density: TestRunDensity;
  onDensityChange: (density: TestRunDensity) => void;
  grouped: boolean;
  onGroupedChange: (grouped: boolean) => void;
  groupByAxis: GroupByAxis;
  showDiff: boolean;
  onShowDiffChange: (showDiff: boolean) => void;
}) => (
  <Box display="flex" alignItems="center" gap={1}>
    <ToggleButtonGroup
      exclusive
      size="small"
      value={view}
      onChange={(_event, next: TestRunView | null) =>
        next && onViewChange(next)
      }
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
      onChange={(_event, next: TestRunDensity | null) =>
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
    {/* the axis is a project setting the details dialog shares, so it is not picked here */}
    <Tooltip
      title={
        // a node for the line breaks: the wrapper forwards only title and children
        <Fragment>
          Collapses a screen&apos;s variations into one{" "}
          {view === "grid" ? "card" : "row"} by group.
          <br />
          Set it in Projects → Edit the project → &quot;Group variations
          by&quot;.
          <br />
          Current axis: {groupByAxis}.
        </Fragment>
      }
    >
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={grouped}
            onChange={(event) => onGroupedChange(event.target.checked)}
            slotProps={{ input: { "aria-label": "Group variations" } }}
            data-testid="groupVariationsToggle"
          />
        }
        label={switchLabel("Group variations")}
        sx={{ marginLeft: 0, marginRight: 0 }}
      />
    </Tooltip>
    {view === "grid" && groupDivider}
    {view === "grid" && (
      <Tooltip title="Toggle diff. Hotkey: D">
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showDiff}
              onChange={(event) => onShowDiffChange(event.target.checked)}
              slotProps={{ input: { "aria-label": "Show diff" } }}
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
