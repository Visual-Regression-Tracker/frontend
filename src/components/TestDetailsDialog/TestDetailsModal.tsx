import { useState } from "react";
import { LinearProgress, Divider } from "@mui/material";
import { TestRun, TestStatus } from "../../types";
import { staticService } from "../../services";
import useImage from "use-image";
import { useNoiseAnalysisAvailable, useSelectedProject } from "../../contexts";
import { imageSizesDiffer } from "../../_helpers/testRunImage.helper";
import {
  MatchingVariationsDialog,
  MatchingVariationsMode,
} from "./MatchingVariationsDialog";
import { TestDetailsHeader } from "./TestDetailsHeader";
import { TestDetailsFooter } from "./TestDetailsFooter";
import { ZoomControls } from "./ZoomControls";
import { TestRunInfoBar } from "./TestRunInfoBar";
import { ComparisonPanels } from "./ComparisonPanels";
import { ViewToolbar } from "./ViewToolbar";
import { useIgnoreAreas } from "./useIgnoreAreas";
import { useDialogSnackbar } from "./useDialogSnackbar";
import { useStageView } from "./useStageView";
import { useViewMode } from "./useViewMode";
import { useNoiseHint } from "./useNoiseHint";
import { NoiseHintPanel } from "./NoiseHintPanel";

const sizeLabel = (image: HTMLImageElement | undefined) =>
  image ? `${image.width}×${image.height}` : undefined;

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

  const [areasShown, setAreasShown] = useState({
    runId: testRun.id,
    shown: true,
  });
  const areasVisible = areasShown.runId !== testRun.id || areasShown.shown;

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
  const view = useViewMode(testRun, !areas.editing);
  const noiseAvailable = useNoiseAnalysisAvailable();
  const showNoiseHint =
    testRun.status === TestStatus.unresolved && noiseAvailable;
  const noiseHint = useNoiseHint(testRun, showNoiseHint);
  const stage = useStageView(
    [currentImage, currentImageStatus],
    [baselineImage, baselineImageStatus],
  );
  const [stageScale, setStageScale] = stage.stageProps.stageScaleState;

  return (
    <>
      <TestDetailsHeader
        testRun={testRun}
        currentRunIndex={currentRunIndex}
        totalTestRunCount={totalTestRunCount}
        noiseHint={
          showNoiseHint && (
            <NoiseHintPanel key={testRun.id} {...noiseHint.panelProps} />
          )
        }
        enqueueSnackbar={enqueueSnackbar}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onClose={handleClose}
      />
      <Divider />
      {areas.processing && <LinearProgress />}
      <TestRunInfoBar
        testRun={testRun}
        sizes={
          imageSizesDiffer(testRun, currentImage, baselineImage)
            ? {
                baseline: sizeLabel(baselineImage),
                checkpoint: sizeLabel(currentImage),
              }
            : null
        }
        toolbar={
          <ViewToolbar
            testRun={testRun}
            view={view}
            areas={areas}
            touched={touched}
            areasShown={areasVisible}
            onAreasShownChange={(shown) =>
              setAreasShown({ runId: testRun.id, shown })
            }
          />
        }
      />
      <ComparisonPanels
        testRun={testRun}
        view={view}
        areas={areas}
        leftRef={stage.leftItemRef}
        rightRef={stage.rightItemRef}
        stageProps={stage.stageProps}
        baseline={[baselineImage, baselineImageStatus]}
        checkpoint={[currentImage, currentImageStatus]}
        diff={[diffImage, diffImageStatus]}
        hintAreas={noiseHint.hintAreas}
        areasShown={areasVisible}
      />
      <TestDetailsFooter
        testRun={testRun}
        zoomControls={
          <ZoomControls
            scale={stageScale}
            onScaleChange={setStageScale}
            onOriginalSize={stage.setOriginalSize}
            onFit={stage.fitImagesToStage}
          />
        }
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
