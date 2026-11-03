import { useId, useState } from "react";
import { Badge, Box, ListItemIcon, Menu, MenuItem } from "@mui/material";
import {
  FilterPanelTrigger,
  GridDensity,
  Toolbar,
  gridDensitySelector,
  useGridApiContext,
  useGridRootProps,
  useGridSelector,
} from "@mui/x-data-grid";
import { ActionButtons } from "./ActionButtons";

const DENSITY_OPTIONS: { value: GridDensity; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "comfortable", label: "Comfortable" },
];

const DensityMenu = () => {
  const apiRef = useGridApiContext();
  const { slots } = useGridRootProps();
  const density = useGridSelector(apiRef, gridDensitySelector);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const buttonId = useId();
  const menuId = useId();
  const icons = {
    compact: slots.densityCompactIcon,
    standard: slots.densityStandardIcon,
    comfortable: slots.densityComfortableIcon,
  };
  const CurrentIcon = icons[density];

  return (
    <>
      <slots.baseButton
        size="small"
        startIcon={<CurrentIcon />}
        id={buttonId}
        aria-label="Density"
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        aria-expanded={!!anchor}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        Density
      </slots.baseButton>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { "aria-labelledby": buttonId } }}
      >
        {DENSITY_OPTIONS.map(({ value, label }) => {
          const Icon = icons[value];
          return (
            <MenuItem
              key={value}
              selected={value === density}
              onClick={() => {
                apiRef.current.setDensity(value);
                setAnchor(null);
              }}
            >
              <ListItemIcon>
                <Icon />
              </ListItemIcon>
              {label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export const UserListToolbar = () => {
  const { slots } = useGridRootProps();

  return (
    <Toolbar>
      <FilterPanelTrigger
        render={(props, state) => (
          <slots.baseButton
            {...props}
            size="small"
            // otherwise the badge's hidden count joins the name
            aria-label="Filters"
            startIcon={
              <Badge badgeContent={state.filterCount} color="primary">
                <slots.openFilterButtonIcon />
              </Badge>
            }
          >
            Filters
          </slots.baseButton>
        )}
      />
      <DensityMenu />
      <Box sx={{ ml: "auto" }}>
        <ActionButtons />
      </Box>
    </Toolbar>
  );
};
