import { type ReactNode } from "react";
import {
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip as MuiTooltip,
  TooltipProps,
  Typography,
} from "@mui/material";
import { ViewList, ViewModule } from "@mui/icons-material";
import { Tooltip } from "../Tooltip";
import { GroupByAxis } from "../../_helpers/testRunGroup.helper";
import { TEST_ID } from "../../constants/locators";

export type TestRunView = "table" | "grid";

export const PAGE_SIZE_OPTIONS = [10, 30, 100];

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
  grouped,
  onGroupedChange,
  groupByAxis,
}: {
  view: TestRunView;
  onViewChange: (view: TestRunView) => void;
  grouped: boolean;
  onGroupedChange: (grouped: boolean) => void;
  groupByAxis: GroupByAxis;
}) => (
  <>
    <Tooltip
      describeChild
      title={`One ${view === "grid" ? "card" : "row"} per screen, its ${groupByAxis} variations behind it. The axis is set in Settings.`}
    >
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={grouped}
            onChange={(event) => onGroupedChange(event.target.checked)}
            data-testid={TEST_ID.groupVariationsToggle}
          />
        }
        label={<Typography variant="body2">Group variations</Typography>}
        sx={{ marginLeft: 0, marginRight: 0.5 }}
      />
    </Tooltip>
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
        testId={TEST_ID.tableViewToggle}
        icon={<ViewList fontSize="small" />}
      />
      <IconToggle
        value="grid"
        title="Grid"
        ariaLabel="Grid view"
        testId={TEST_ID.gridViewToggle}
        icon={<ViewModule fontSize="small" />}
      />
    </ToggleButtonGroup>
  </>
);
