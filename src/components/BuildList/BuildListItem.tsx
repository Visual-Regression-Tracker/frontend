import type { MouseEvent } from "react";
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  LinearProgress,
  ListItemButton,
  Typography,
} from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";
import { Build } from "../../types";
import { DateLabel } from "../DateLabel";
import { Tooltip } from "../Tooltip";
import { statusColor } from "../../theme";
import { buildSummary, hasLaterRun } from "../../_helpers/build.helper";

const ROW_ACTIVE =
  ".MuiListItemButton-root:hover &, .MuiListItemButton-root:focus-within &";

const showOnHover = { opacity: 0, [ROW_ACTIVE]: { opacity: 1 } } as const;

interface BuildListItemProps {
  build: Build;
  selected: boolean;
  checked: boolean;
  selecting: boolean;
  onOpen: () => void;
  onToggleChecked: () => void;
  onMenuClick: (event: MouseEvent<HTMLElement>) => void;
}

export const BuildListItem = ({
  build,
  selected,
  checked,
  selecting,
  onOpen,
  onToggleChecked,
  onMenuClick,
}: BuildListItemProps) => {
  const color = statusColor(build.status);
  return (
    <>
      <ListItemButton
        selected={selected}
        onClick={onOpen}
        sx={{
          display: "grid",
          gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
          columnGap: 1,
          alignItems: "center",
          py: 0.75,
          pl: 1,
          pr: 1,
        }}
      >
        <Box sx={{ display: "grid", placeItems: "center", width: 28 }}>
          <Box
            data-testid="build-status-dot"
            sx={{
              gridArea: "1 / 1",
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: color === "default" ? "text.disabled" : `${color}.main`,
              ...(selecting
                ? { opacity: 0 }
                : { [ROW_ACTIVE]: { opacity: 0 } }),
            }}
          />
          <Checkbox
            size="small"
            checked={checked}
            onClick={(event) => event.stopPropagation()}
            onChange={onToggleChecked}
            sx={{
              gridArea: "1 / 1",
              p: 0.5,
              ...(selecting ? { opacity: 1 } : showOnHover),
            }}
            slotProps={{
              input: { "aria-label": `Select build #${build.number}` },
            }}
          />
        </Box>
        <Typography
          variant="subtitle2"
          noWrap
        >{`#${build.number} ${build.ciBuildId || ""}`}</Typography>
        <Tooltip title={build.branchName}>
          <Chip size="small" label={build.branchName} sx={{ maxWidth: 120 }} />
        </Tooltip>
        <IconButton
          size="small"
          aria-label="Build menu"
          onClick={onMenuClick}
          sx={showOnHover}
        >
          <MoreHoriz fontSize="small" />
        </IconButton>
        <Typography
          variant="caption"
          noWrap
          sx={{ gridColumn: "2 / -1", color: "text.secondary" }}
        >
          <DateLabel date={build.createdAt} />
          {` · ${buildSummary(build)}`}
          {hasLaterRun(build) && build.updatedAt && (
            <>
              {" · Last run: "}
              <DateLabel date={build.updatedAt} />
            </>
          )}
        </Typography>
      </ListItemButton>
      {build.isRunning && <LinearProgress sx={{ height: 2 }} />}
    </>
  );
};
