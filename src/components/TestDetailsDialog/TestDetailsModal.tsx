import { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Switch,
  Box,
  LinearProgress,
  Divider,
} from "@mui/material";
import { useHotkeys } from "react-hotkeys-hook";
import { hotkeyOptions } from "../../_helpers/hotkeys.helper";
import { TestRun } from "../../types";
import { staticService } from "../../services";
import { OpenInNew } from "@mui/icons-material";
import useImage from "use-image";
import { routes } from "../../constants";
import { useSelectedProject } from "../../contexts";
import { imageSizesDiffer } from "../../_helpers/testRunImage.helper";
import { DrawArea, ImageStateLoad } from "./DrawArea";
import {
  MatchingVariationsDialog,
  MatchingVariationsMode,
} from "./MatchingVariationsDialog";
import { Tooltip } from "../Tooltip";
import ImageDetails, { ImageDetailsProps } from "./ImageDetails";
import { canCompareToBaseline } from "../../_helpers/testRunStatus.helper";
import { TestDetailsHeader } from "./TestDetailsHeader";
import { TestDetailsFooter } from "./TestDetailsFooter";
import { OverlayControls } from "./OverlayControls";
import { ZoomControls } from "./ZoomControls";
import { IgnoreAreasToolbar } from "./IgnoreAreasToolbar";
import { TestRunInfoBar } from "./TestRunInfoBar";
import { useIgnoreAreas } from "./useIgnoreAreas";
import { useDialogSnackbar } from "./useDialogSnackbar";
import { useStageView } from "./useStageView";

const drawAreaContainerSx = { width: "100%", height: "100%" } as const;
const drawAreaItemSx = { padding: "0 4px", height: "100%" } as const;
const imageToolbarSx = {
  alignItems: "center",
  paddingLeft: "5px",
  height: "44px",
} as const;

interface TestDetailsModalProps {
  testRun: TestRun;
  currentRunIndex: number;
  totalTestRunCount: number;
  touched: boolean;
  handleClose: () => void;
  handlePrevious: () => void;
  handleNext: () => void;
  navigateTo: (id: string) => void;
}

const TestDetailsModal = ({
  testRun,
  currentRunIndex,
  totalTestRunCount,
  touched,
  handlePrevious,
  handleNext,
  handleClose,
  navigateTo,
}: TestDetailsModalProps) => {
  const project = useSelectedProject();
  const [variationsMode, setVariationsMode] =
    useState<MatchingVariationsMode | null>(null);

  const [isDiffShown, setIsDiffShown] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [blendDifference, setBlendDifference] = useState(false);

  const [currentImage, currentImageStatus] = useImage(
    staticService.getImage(testRun.imageName),
  );

  const [baselineImage, baselineImageStatus] = useImage(
    staticService.getImage(testRun.baselineName),
  );

  const [diffImage, diffImageStatus] = useImage(
    staticService.getImage(testRun.diffName),
  );

  // one instance, so a toast replaces the last one whichever part of the dialog raised it
  const { enqueueSnackbar } = useDialogSnackbar();
  const areas = useIgnoreAreas(testRun, currentImage, enqueueSnackbar);
  const stage = useStageView(
    [currentImage, currentImageStatus],
    [baselineImage, baselineImageStatus],
  );
  const [stageScale, setStageScale] = stage.stageProps.stageScaleState;

  // per-run view state; this dialog is not remounted between runs
  useEffect(() => {
    setIsDiffShown(!!testRun.diffName);
    setOverlayOpacity(1);
    setBlendDifference(false);
  }, [testRun.id, testRun.diffName]);

  useHotkeys(
    "d",
    () => {
      if (testRun.diffName) {
        setIsDiffShown((isDiffShown) => !isDiffShown);
      }
    },
    hotkeyOptions,
    [testRun.diffName],
  );

  const openHistoryTab = () => {
    window.open(
      `${routes.VARIATION_DETAILS_PAGE}/${testRun.testVariationId}`,
      "_blank",
    );
  };

  const baselinePanel = () => (
    <Grid size={6} ref={stage.leftItemRef} sx={drawAreaItemSx}>
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
      <Grid>
        <DrawArea
          imageName={testRun.baselineName}
          imageState={[baselineImage, baselineImageStatus]}
          ignoreAreas={[]}
          tempIgnoreAreas={[]}
          setIgnoreAreas={areas.changeIgnoreAreas}
          selectedRectId={areas.selectedRectId}
          setSelectedRectId={areas.setSelectedRectId}
          onStageClick={areas.removeSelection}
          {...stage.stageProps}
          drawModeState={[false, areas.setIsDrawMode]}
        />
      </Grid>
    </Grid>
  );

  const diffPanel = (
    type: ImageDetailsProps["type"],
    imageName: string | null,
    imageStatus: ImageStateLoad,
    image: HTMLImageElement | undefined,
  ) => (
    <Grid size={6} sx={drawAreaItemSx} ref={stage.rightItemRef}>
      <Grid container spacing={1} sx={imageToolbarSx}>
        <ImageDetails
          type={type}
          branchName={testRun.branchName}
          imageName={imageName}
          image={image}
          ignoreAreas={areas.tempIgnoreAreas}
        />
        {testRun.diffName && (
          <Grid>
            <Tooltip title={"Toggle diff. Hotkey: D"}>
              <Switch
                checked={isDiffShown}
                onChange={() => setIsDiffShown(!isDiffShown)}
                name="Toggle diff"
                slotProps={{ input: { "aria-label": "Toggle diff" } }}
              />
            </Tooltip>
          </Grid>
        )}
        {/* OverlayControls is a plain flex row: a nested Grid's spacing would lift it off the line */}
        <Grid size="grow">
          {canCompareToBaseline(testRun) && (
            <OverlayControls
              opacity={overlayOpacity}
              blendDifference={blendDifference}
              onOpacityChange={(opacity) => {
                setOverlayOpacity(opacity);
                setIsDiffShown(false);
              }}
              onBlendToggle={() => {
                setBlendDifference((blend) => !blend);
                setIsDiffShown(false);
              }}
            />
          )}
        </Grid>
      </Grid>
      <DrawArea
        imageName={imageName}
        imageState={[image, imageStatus]}
        underlayImage={isDiffShown ? undefined : baselineImage}
        overlayOpacity={overlayOpacity}
        blendDifference={blendDifference && !isDiffShown}
        ignoreAreas={areas.ignoreAreas}
        tempIgnoreAreas={areas.tempIgnoreAreas}
        setIgnoreAreas={areas.changeIgnoreAreas}
        selectedRectId={areas.selectedRectId}
        deleteIgnoreArea={areas.deleteIgnoreArea}
        setSelectedRectId={areas.setSelectedRectId}
        onStageClick={areas.removeSelection}
        {...stage.stageProps}
        drawModeState={[areas.isDrawMode, areas.setIsDrawMode]}
      />
    </Grid>
  );

  return (
    <>
      <TestDetailsHeader
        testRun={testRun}
        currentRunIndex={currentRunIndex}
        totalTestRunCount={totalTestRunCount}
        onClose={handleClose}
      />
      <Divider />
      {areas.processing && <LinearProgress />}
      <TestRunInfoBar
        testRun={testRun}
        sizeMismatch={imageSizesDiffer(testRun, currentImage, baselineImage)}
        enqueueSnackbar={enqueueSnackbar}
        ignoreAreasToolbar={
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
          />
        }
      />
      <Box
        sx={{
          overflow: "hidden",
          position: "relative",
          ...drawAreaContainerSx,
        }}
      >
        <Grid container sx={{ height: "100%", justifyContent: "center" }}>
          {baselinePanel()}
          {isDiffShown
            ? diffPanel("Diff", testRun.diffName, diffImageStatus, diffImage)
            : diffPanel(
                "Image",
                testRun.imageName,
                currentImageStatus,
                currentImage,
              )}
        </Grid>
      </Box>
      <TestDetailsFooter
        testRun={testRun}
        currentRunIndex={currentRunIndex}
        totalTestRunCount={totalTestRunCount}
        zoomControls={
          <ZoomControls
            scale={stageScale}
            onScaleChange={setStageScale}
            onOriginalSize={stage.setOriginalSize}
            onFit={stage.fitImagesToStage}
          />
        }
        onPrevious={handlePrevious}
        onNext={handleNext}
        onOpenVariations={setVariationsMode}
      />
      {variationsMode && (
        <MatchingVariationsDialog
          key={testRun.id}
          mode={variationsMode}
          testRun={testRun}
          groupBy={project?.bulkApproveGroupBy}
          onClose={() => setVariationsMode(null)}
          navigateTo={navigateTo}
        />
      )}
    </>
  );
};

export default TestDetailsModal;
