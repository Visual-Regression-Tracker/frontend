import { Box, Slider, Typography } from "@mui/material";
import { Tooltip } from "../Tooltip";
import { TEST_ID } from "../../constants/locators";

interface OverlayControlsProps {
  opacity: number;
  onOpacityChange: (opacity: number) => void;
}

export const OverlayControls = ({
  opacity,
  onOpacityChange,
}: OverlayControlsProps) => (
  <Tooltip title="Fade the checkpoint out to see the baseline through it">
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Typography variant="caption" color="textSecondary" noWrap>
        Baseline
      </Typography>
      <Box
        data-testid={TEST_ID.overlayOpacity}
        sx={{ width: 180, maxWidth: "100%", display: "flex" }}
      >
        <Slider
          size="small"
          min={0}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(_event, value) => onOpacityChange(value)}
          aria-label="Fade to the baseline"
        />
      </Box>
      <Typography variant="caption" color="textSecondary" noWrap>
        Checkpoint
      </Typography>
    </Box>
  </Tooltip>
);
