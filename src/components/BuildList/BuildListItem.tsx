import { Fragment, type MouseEvent } from "react";
import {
  Box,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { Build } from "../../types";
import { BuildStatusChip } from "../BuildStatusChip";
import { Tooltip } from "../Tooltip";
import { formatDateTime } from "../../_helpers/format.helper";

const itemSx = {
  paddingRight: "48px",
  "&:hover .build-secondary-action": {
    visibility: "inherit",
  },
} as const;

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
    <ListItemButton selected={selected} onClick={onOpen} sx={itemSx}>
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
            <Grid>
              <Typography variant="caption" color="textPrimary">
                {formatDateTime(build.createdAt)}
              </Typography>
            </Grid>
            {build.updatedAt && (
              <Grid>
                <Typography variant="caption" color="textSecondary">
                  Last run: {formatDateTime(build.updatedAt)}
                </Typography>
              </Grid>
            )}
            <Grid>
              <Grid container justifyContent="space-between">
                <Grid>
                  <Tooltip title={build.branchName}>
                    <Chip
                      size="small"
                      label={build.branchName}
                      style={{ maxWidth: 180 }}
                    />
                  </Tooltip>
                </Grid>
                <Grid>
                  <BuildStatusChip status={build.status} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        }
      />

      <Box
        className="build-secondary-action"
        sx={{
          position: "absolute",
          right: 16,
          top: "50%",
          transform: "translateY(-50%)",
          visibility: "hidden",
        }}
      >
        <IconButton onClick={onMenuClick} size="large">
          <MoreVert data-testid="MoreVertIcon" />
        </IconButton>
      </Box>
    </ListItemButton>
    {build.isRunning && <LinearProgress />}
  </Fragment>
);
