import { Fragment, type MouseEvent } from "react";
import {
  Checkbox,
  Chip,
  GridLegacy as Grid,
  IconButton,
  LinearProgress,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { Build } from "../../types";
import { BuildStatusChip } from "../BuildStatusChip";
import { Tooltip } from "../Tooltip";
import { formatDateTime } from "../../_helpers/format.helper";

interface BuildListItemProps {
  build: Build;
  selected: boolean;
  checked: boolean;
  onOpen: () => void;
  onToggleChecked: () => void;
  onMenuClick: (event: MouseEvent<HTMLElement>) => void;
}

export const BuildListItem = ({
  build,
  selected,
  checked,
  onOpen,
  onToggleChecked,
  onMenuClick,
}: BuildListItemProps) => (
  <Fragment>
    <ListItemButton
      selected={selected}
      onClick={onOpen}
      sx={{
        paddingRight: "48px",
        "&:hover .build-secondary-action": {
          visibility: "inherit",
        },
      }}
    >
      <Checkbox
        edge="start"
        size="small"
        checked={checked}
        onClick={(event) => event.stopPropagation()}
        onChange={onToggleChecked}
      />
      <ListItemText
        disableTypography
        primary={
          <Typography
            variant="subtitle2"
            style={{
              wordWrap: "break-word",
            }}
          >
            {`#${build.number} ${build.ciBuildId || ""}`}
          </Typography>
        }
        secondary={
          <Grid container direction="column">
            <Grid item>
              <Typography variant="caption" color="textPrimary">
                {formatDateTime(build.createdAt)}
              </Typography>
            </Grid>
            {build.updatedAt && (
              <Grid item>
                <Typography variant="caption" color="textSecondary">
                  Last run: {formatDateTime(build.updatedAt)}
                </Typography>
              </Grid>
            )}
            <Grid item>
              <Grid container justifyContent="space-between">
                <Grid item>
                  <Tooltip title={build.branchName}>
                    <Chip
                      size="small"
                      label={build.branchName}
                      style={{ maxWidth: 180 }}
                    />
                  </Tooltip>
                </Grid>
                <Grid item>
                  <BuildStatusChip status={build.status} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        }
      />

      <ListItemSecondaryAction
        className="build-secondary-action"
        sx={{ visibility: "hidden" }}
      >
        <IconButton onClick={onMenuClick} size="large">
          <MoreVert data-testid="MoreVertIcon" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItemButton>
    {build.isRunning && <LinearProgress />}
  </Fragment>
);
