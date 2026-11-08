import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { HotkeyHint } from "../HotkeyHint";
import type { ViewMode } from "./useViewMode";

interface ViewModeStripProps {
  mode: ViewMode;
  hasDiff: boolean;
  canFade: boolean;
  onChange: (mode: ViewMode) => void;
}

export const ViewModeStrip = ({
  mode,
  hasDiff,
  canFade,
  onChange,
}: ViewModeStripProps) => (
  <ToggleButtonGroup
    exclusive
    size="small"
    value={mode}
    aria-label="View mode"
    onChange={(_event, value: ViewMode | null) => value && onChange(value)}
  >
    <ToggleButton value="sideBySide" sx={{ textTransform: "none" }}>
      Side by side
    </ToggleButton>
    {hasDiff && (
      <ToggleButton value="diff" sx={{ textTransform: "none" }}>
        Diff
        <HotkeyHint>D</HotkeyHint>
      </ToggleButton>
    )}
    {canFade && (
      <ToggleButton value="fade" sx={{ textTransform: "none" }}>
        Fade
      </ToggleButton>
    )}
  </ToggleButtonGroup>
);
