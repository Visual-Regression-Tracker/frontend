import type { RefObject } from "react";
import { Box, Button, Grid } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { routes } from "../../constants";
import { NoiseRegion } from "../../types";
import { TestRun } from "../../types/testRun";
import { DrawArea, ImageStateLoad } from "./DrawArea";
import ImageDetails, { ImageDetailsProps } from "./ImageDetails";
import type { useIgnoreAreas } from "./useIgnoreAreas";
import type { useStageView } from "./useStageView";
import type { ViewState } from "./useViewMode";

const drawAreaItemSx = { padding: "0 4px", height: "100%" } as const;
const imageToolbarSx = {
  alignItems: "center",
  paddingLeft: "5px",
  height: "44px",
} as const;

type LoadedImage = [HTMLImageElement | undefined, ImageStateLoad];

interface ComparisonPanelsProps {
  testRun: TestRun;
  view: ViewState;
  areas: ReturnType<typeof useIgnoreAreas>;
  leftRef: RefObject<HTMLDivElement | null>;
  rightRef: RefObject<HTMLDivElement | null>;
  stageProps: ReturnType<typeof useStageView>["stageProps"];
  baseline: LoadedImage;
  checkpoint: LoadedImage;
  diff: LoadedImage;
  hintAreas: NoiseRegion[];
  areasShown: boolean;
}

export const ComparisonPanels = ({
  testRun,
  view,
  areas,
  leftRef,
  rightRef,
  stageProps,
  baseline: [baselineImage, baselineImageStatus],
  checkpoint,
  diff,
  hintAreas,
  areasShown,
}: ComparisonPanelsProps) => {
  const showDiff = view.mode === "diff" && !!testRun.diffName;
  const fading = view.mode === "fade";
  const [image, imageStatus] = showDiff ? diff : checkpoint;
  const visible = areas.editing || areasShown;

  const openHistoryTab = () => {
    window.open(
      `${routes.VARIATION_DETAILS_PAGE}/${testRun.testVariationId}`,
      "_blank",
    );
  };

  const panelType: ImageDetailsProps["type"] = showDiff ? "Diff" : "Image";

  return (
    <Box
      sx={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <Grid container sx={{ height: "100%", justifyContent: "center" }}>
        <Grid size={6} ref={leftRef} sx={drawAreaItemSx}>
          <Grid container spacing={1} sx={imageToolbarSx}>
            <ImageDetails
              type="Baseline"
              branchName={testRun.baselineBranchName}
              imageName={testRun.baselineName}
              image={baselineImage}
              ignoreAreas={[]}
            />
            <Grid>
              <Button
                color="primary"
                disabled={!testRun.testVariationId}
                onClick={openHistoryTab}
              >
                History <OpenInNew fontSize="small" />
              </Button>
            </Grid>
          </Grid>
          <DrawArea
            imageName={testRun.baselineName}
            imageState={[baselineImage, baselineImageStatus]}
            readOnly
            ignoreAreas={[]}
            tempIgnoreAreas={[]}
            setIgnoreAreas={areas.changeIgnoreAreas}
            selectedRectId={areas.selectedRectId}
            setSelectedRectId={areas.setSelectedRectId}
            onStageClick={areas.removeSelection}
            {...stageProps}
            drawModeState={[false, areas.setIsDrawMode]}
          />
        </Grid>
        <Grid size={6} sx={drawAreaItemSx} ref={rightRef}>
          <Grid container spacing={1} sx={imageToolbarSx}>
            <ImageDetails
              type={panelType}
              branchName={testRun.branchName}
              imageName={showDiff ? testRun.diffName : testRun.imageName}
              image={image}
              ignoreAreas={areas.tempIgnoreAreas}
            />
          </Grid>
          <DrawArea
            imageName={showDiff ? testRun.diffName : testRun.imageName}
            imageState={[image, imageStatus]}
            underlayImage={fading ? baselineImage : undefined}
            overlayOpacity={view.opacity}
            blendDifference={view.blendDifference && fading}
            readOnly={!areas.editing}
            ignoreAreas={visible ? areas.ignoreAreas : []}
            tempIgnoreAreas={visible ? areas.tempIgnoreAreas : []}
            hintAreas={hintAreas}
            setIgnoreAreas={areas.changeIgnoreAreas}
            selectedRectId={areas.selectedRectId}
            deleteIgnoreArea={
              areas.editing ? areas.deleteIgnoreArea : undefined
            }
            setSelectedRectId={areas.setSelectedRectId}
            onStageClick={areas.removeSelection}
            {...stageProps}
            drawModeState={[areas.isDrawMode, areas.setIsDrawMode]}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
