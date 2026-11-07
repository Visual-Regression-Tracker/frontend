import { Fragment, type ReactNode, useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip as MuiTooltip,
  TooltipProps,
  Typography,
} from "@mui/material";
import { ArrowDropDown, ViewList, ViewModule } from "@mui/icons-material";
import { Tooltip } from "../Tooltip";
import { GroupByAxis } from "../../_helpers/testRunGroup.helper";

export type TestRunView = "table" | "grid";

// the data grid's own density values, so it can take this straight as a prop
export type TestRunDensity = "compact" | "standard" | "comfortable";

interface DiffToggle {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const PAGE_SIZE_OPTIONS = [10, 30, 100];

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

const DENSITIES: { value: TestRunDensity; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "comfortable", label: "Comfortable" },
];

const ShowDiffSwitch = ({
  diffToggle,
  testId,
}: {
  diffToggle: DiffToggle;
  testId: string;
}) => (
  <Tooltip title="Toggle diff. Hotkey: D">
    <FormControlLabel
      control={
        <Switch
          size="small"
          checked={diffToggle.checked}
          onChange={(event) => diffToggle.onChange(event.target.checked)}
          slotProps={{ input: { "aria-label": "Show diff" } }}
          data-testid={testId}
        />
      }
      label={switchLabel("Show diff")}
      sx={{ marginLeft: 0, marginRight: 0 }}
    />
  </Tooltip>
);

const ViewMenu = ({
  view,
  density,
  onDensityChange,
  grouped,
  onGroupedChange,
  groupByAxis,
  diffToggle,
}: Pick<
  Props,
  | "view"
  | "density"
  | "onDensityChange"
  | "grouped"
  | "onGroupedChange"
  | "groupByAxis"
  | "diffToggle"
>) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  const groupHint = (
    <Fragment>
      Collapses a screen&apos;s variations into one{" "}
      {view === "grid" ? "card" : "row"} by group.
      <br />
      Set the axis in Settings → &quot;Group variations by&quot;.
      <br />
      Current axis: {groupByAxis}.
    </Fragment>
  );

  return (
    <>
      <Button
        size="small"
        color="inherit"
        endIcon={<ArrowDropDown />}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        data-testid="viewMenuButton"
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        View
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={close}>
        <ListSubheader>Density</ListSubheader>
        {DENSITIES.map(({ value, label }) => (
          <MenuItem
            key={value}
            dense
            role="menuitemradio"
            aria-checked={density === value}
            selected={density === value}
            data-testid={`${value}Density`}
            onClick={() => {
              onDensityChange(value);
              close();
            }}
          >
            <ListItemText primary={label} />
          </MenuItem>
        ))}
        <Divider />
        <ListSubheader>Group by</ListSubheader>
        {[
          { grouped: false, label: "None", testId: "groupByNone" },
          {
            grouped: true,
            label: `Variation (${groupByAxis})`,
            testId: "groupByVariation",
          },
        ].map((option) => (
          <MuiTooltip
            key={option.testId}
            placement="right"
            arrow
            disableInteractive
            title={groupHint}
          >
            <MenuItem
              dense
              role="menuitemradio"
              aria-checked={grouped === option.grouped}
              selected={grouped === option.grouped}
              data-testid={option.testId}
              onClick={() => {
                onGroupedChange(option.grouped);
                close();
              }}
            >
              <ListItemText primary={option.label} />
            </MenuItem>
          </MuiTooltip>
        ))}
        <Divider />
        <MenuItem
          dense
          role="menuitemcheckbox"
          aria-checked={diffToggle.checked}
          data-testid="viewMenuShowDiff"
          onClick={() => diffToggle.onChange(!diffToggle.checked)}
        >
          <ListItemText primary="Show diff in grid" secondary="Hotkey: D" />
        </MenuItem>
      </Menu>
    </>
  );
};

interface Props {
  view: TestRunView;
  onViewChange: (view: TestRunView) => void;
  density: TestRunDensity;
  onDensityChange: (density: TestRunDensity) => void;
  grouped: boolean;
  onGroupedChange: (grouped: boolean) => void;
  groupByAxis: GroupByAxis;
  diffToggle: DiffToggle;
}

export const TestRunListControls = ({ onViewChange, ...menu }: Props) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    {menu.view === "grid" && (
      <ShowDiffSwitch diffToggle={menu.diffToggle} testId="showDiffToggle" />
    )}
    <ToggleButtonGroup
      exclusive
      size="small"
      value={menu.view}
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
    <ViewMenu {...menu} />
  </Box>
);
