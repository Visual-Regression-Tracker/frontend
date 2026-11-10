import { Box, Button, Chip, Stack } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { canCompareToBaseline } from "../../_helpers/testRunStatus.helper";
import { TestRun } from "../../types";
import { IgnoreAreasToolbar } from "./IgnoreAreasToolbar";
import { OverlayControls } from "./OverlayControls";
import { ViewModeStrip } from "./ViewModeStrip";
import type { useIgnoreAreas } from "./useIgnoreAreas";
import type { ViewState } from "./useViewMode";

interface ViewToolbarProps {
  testRun: TestRun;
  view: ViewState;
  areas: ReturnType<typeof useIgnoreAreas>;
  touched: boolean;
  areasShown: boolean;
  onAreasShownChange: (shown: boolean) => void;
}

export const ViewToolbar = ({
  testRun,
  view,
  areas,
  touched,
  areasShown,
  onAreasShownChange,
}: ViewToolbarProps) => {
  const hasDiff = !!testRun.diffName;
  const canFade = canCompareToBaseline(testRun);

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "center", minHeight: 44, py: 0.5 }}
    >
      {areas.editing ? (
        <IgnoreAreasToolbar
          areaKind={areas.areaKind}
          onAreaKindChange={areas.setAreaKind}
          isDrawMode={areas.isDrawMode}
          onDrawModeChange={areas.setIsDrawMode}
          hasSelection={!!areas.selectedRectId}
          hasAreas={areas.ignoreAreas.length > 0}
          touched={touched}
          onDelete={areas.deleteSelected}
          onClear={areas.clear}
          onApplyToBuild={areas.applyToBuild}
          onSave={areas.save}
          onCancel={areas.cancelEditing}
        />
      ) : (
        <>
          {(hasDiff || canFade) && (
            <ViewModeStrip
              mode={view.mode}
              hasDiff={hasDiff}
              canFade={canFade}
              onChange={view.setMode}
            />
          )}
          {view.mode === "fade" && canFade && (
            <OverlayControls
              opacity={view.opacity}
              onOpacityChange={view.setOpacity}
            />
          )}
          <Box sx={{ flexGrow: 1 }} />
          {areas.ignoreAreas.length > 0 && (
            <Chip
              size="small"
              label={`Ignore areas (${areas.ignoreAreas.length})`}
              variant={areasShown ? "filled" : "outlined"}
              aria-pressed={areasShown}
              onClick={() => onAreasShownChange(!areasShown)}
            />
          )}
          <Button
            size="small"
            startIcon={<Edit />}
            sx={{ textTransform: "none" }}
            onClick={areas.startEditing}
          >
            Edit areas
          </Button>
        </>
      )}
    </Stack>
  );
};
