import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { HotkeyHint } from "../HotkeyHint";
import type { ViewMode } from "./useViewMode";

const segmentSx = { textTransform: "none" } as const;

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
}: ViewModeStripProps) => {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={mode}
      aria-label="View mode"
      onChange={(_event, value: ViewMode | null) => value && onChange(value)}
    >
      <ToggleButton value="sideBySide" sx={segmentSx}>
        Side by side
      </ToggleButton>
      {hasDiff && (
        <ToggleButton value="diff" aria-keyshortcuts="d" sx={segmentSx}>
          Diff
          <HotkeyHint>D</HotkeyHint>
        </ToggleButton>
      )}
      {canFade && (
        <ToggleButton value="fade" sx={segmentSx}>
          Fade
        </ToggleButton>
      )}
    </ToggleButtonGroup>
  );
};
