import { GridLegacy as Grid, IconButton } from "@mui/material";
import {
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
} from "@mui/icons-material";
import { Tooltip } from "../Tooltip";
import { clampScale } from "../../_helpers/scale.helper";

const SCALE_STEP = 1.2;
const scaleActionsSx = { display: "flex", alignItems: "center" } as const;

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
  <Grid item xs={3} sx={scaleActionsSx}>
    <Tooltip title={"Zoom In"}>
      <IconButton
        onClick={() => onScaleChange(clampScale(scale * SCALE_STEP))}
        size="large"
      >
        <ZoomIn data-testid="ZoomInIcon" />
      </IconButton>
    </Tooltip>
    <Tooltip title={"Zoom Out"}>
      <IconButton
        onClick={() => onScaleChange(clampScale(scale / SCALE_STEP))}
        size="large"
      >
        <ZoomOut data-testid="ZoomOutIcon" />
      </IconButton>
    </Tooltip>
    <Tooltip title={"Original size"}>
      <IconButton onClick={onOriginalSize} size="large">
        <Fullscreen data-testid="FullscreenIcon" />
      </IconButton>
    </Tooltip>
    <Tooltip title={"Fit into screen"}>
      <IconButton onClick={onFit} size="large">
        <FullscreenExit data-testid="FullscreenExitIcon" />
      </IconButton>
    </Tooltip>
  </Grid>
);
