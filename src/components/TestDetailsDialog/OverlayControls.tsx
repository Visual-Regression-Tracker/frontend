import {
  Box,
  Slider,
  ToggleButton,
  Tooltip as MuiTooltip,
  Typography,
} from "@mui/material";
import { Compare } from "@mui/icons-material";

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
  <Box display="flex" alignItems="center" gap={1}>
    <MuiTooltip title="Fade the checkpoint out to see the baseline through it">
      <Box display="flex" alignItems="center" gap={1} minWidth={0}>
        <Typography variant="caption" color="textSecondary" noWrap>
          Fade
        </Typography>
        <Box
          width={180}
          maxWidth="100%"
          display="flex"
          data-testid="overlayOpacity"
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
      </Box>
    </MuiTooltip>
    <MuiTooltip title="Blend the two as a difference: what matches goes black, and a shift shows as an offset ghost">
      <ToggleButton
        value="blend"
        size="small"
        selected={blendDifference}
        onChange={onBlendToggle}
        data-testid="differenceToggle"
        style={{ padding: 4, marginLeft: 8 }}
      >
        <Compare fontSize="small" />
      </ToggleButton>
    </MuiTooltip>
  </Box>
);
