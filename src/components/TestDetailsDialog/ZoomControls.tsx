import { Button, IconButton, Typography } from "@mui/material";
import { AddRounded, RemoveRounded } from "@mui/icons-material";
import { Tooltip } from "../Tooltip";
import { clampScale } from "../../_helpers/scale.helper";

const SCALE_STEP = 1.2;
const textButtonSx = { textTransform: "none", minWidth: 0 } as const;

interface ZoomControlsProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  onOriginalSize: () => void;
  onFit: () => void;
}

export const ZoomControls = ({
  scale,
  onScaleChange,
  onOriginalSize,
  onFit,
}: ZoomControlsProps) => (
  <>
    <Tooltip title="Zoom out">
      <IconButton
        aria-label="Zoom out"
        onClick={() => onScaleChange(clampScale(scale / SCALE_STEP))}
      >
        <RemoveRounded />
      </IconButton>
    </Tooltip>
    <Typography
      variant="body2"
      color="textSecondary"
      data-testid="zoom-level"
      sx={{ minWidth: 44, textAlign: "center" }}
    >
      {`${Math.round(scale * 100)}%`}
    </Typography>
    <Tooltip title="Zoom in">
      <IconButton
        aria-label="Zoom in"
        onClick={() => onScaleChange(clampScale(scale * SCALE_STEP))}
      >
        <AddRounded />
      </IconButton>
    </Tooltip>
    <Tooltip title="Original size">
      <Button
        aria-label="Original size"
        sx={textButtonSx}
        onClick={onOriginalSize}
      >
        1:1
      </Button>
    </Tooltip>
    <Tooltip title="Fit into screen">
      <Button aria-label="Fit into screen" sx={textButtonSx} onClick={onFit}>
        Fit
      </Button>
    </Tooltip>
  </>
);
