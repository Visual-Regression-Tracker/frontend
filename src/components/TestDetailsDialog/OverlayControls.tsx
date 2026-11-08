import { Box, Slider, ToggleButton, Typography } from "@mui/material";
import { Compare } from "@mui/icons-material";
import { Tooltip } from "../Tooltip";
import { TEST_ID } from "../../constants/locators";

interface OverlayControlsProps {
  opacity: number;
  blendDifference: boolean;
  onOpacityChange: (opacity: number) => void;
  onBlendToggle: () => void;
}

export const OverlayControls = ({
  opacity,
  blendDifference,
  onOpacityChange,
  onBlendToggle,
}: OverlayControlsProps) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
            disabled={blendDifference}
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
    <Tooltip title="Blend the two as a difference: what matches goes black, and a shift shows as an offset ghost">
      <ToggleButton
        value="blend"
        size="small"
        selected={blendDifference}
        onChange={onBlendToggle}
        data-testid={TEST_ID.differenceToggle}
        aria-label="Difference blend"
        sx={{ px: 1, py: 0.25, textTransform: "none", gap: 0.5 }}
      >
        <Compare fontSize="small" />
        Difference blend
      </ToggleButton>
    </Tooltip>
  </Box>
);
