import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { HotkeyHint } from "../HotkeyHint";
import { Tooltip } from "../Tooltip";
import type { ViewMode } from "./useViewMode";

const segmentSx = { textTransform: "none" } as const;

interface ViewModeStripProps {
  mode: ViewMode;
  hasDiff: boolean;
  canFade: boolean;
  noiselessUnavailable?: string;
  onChange: (mode: ViewMode) => void;
}

export const ViewModeStrip = ({
  mode,
  hasDiff,
  canFade,
  noiselessUnavailable,
  onChange,
}: ViewModeStripProps) => {
  const noiseless = (
    <ToggleButton
      value="noiseless"
      disabled={!!noiselessUnavailable}
      sx={segmentSx}
    >
      Diff without noise
    </ToggleButton>
  );

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
      {hasDiff &&
        (noiselessUnavailable ? (
          <Tooltip title={noiselessUnavailable}>
            <span>{noiseless}</span>
          </Tooltip>
        ) : (
          noiseless
        ))}
      {canFade && (
        <ToggleButton value="fade" sx={segmentSx}>
          Fade
        </ToggleButton>
      )}
    </ToggleButtonGroup>
  );
};
