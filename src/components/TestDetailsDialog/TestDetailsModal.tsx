import { type ComponentProps, useState } from "react";
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
import { NoiselessBanner } from "./NoiselessBanner";
import { UNAVAILABLE_HINT, useNoiselessDiff } from "./useNoiselessDiff";
import {
  changedPatches,
  noiselessCaveat,
} from "../../_helpers/noiseRegions.helper";

type LoadedImage = ComponentProps<typeof ComparisonPanels>["diff"];

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
  const noiseless = view.mode === "noiseless";
  const noiselessView = useNoiselessDiff(testRun, noiseless);
  const [noiselessImage, noiselessImageStatus] = useImage(
    noiselessView.status === "ready" ? noiselessView.url : "",
  );
  const noiselessPanelImage = (): LoadedImage | undefined => {
    if (noiselessView.status === "ready") {
      return [noiselessImage, noiselessImageStatus];
    }
    return noiselessView.status === "computing"
      ? [undefined, "loading"]
      : undefined;
  };
  const { analysis, stage: hintStage } = noiseHint.panelProps;
  const patches = noiseless ? changedPatches(analysis) : [];
  const hintAreas = noiseless
    ? [...(hintStage === "dinov2" ? [] : noiseHint.hintAreas), ...patches]
    : noiseHint.hintAreas;

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
            noiselessUnavailable={
              noiselessView.status === "unavailable"
                ? UNAVAILABLE_HINT[noiselessView.reason]
                : undefined
            }
            onAreasShownChange={(shown) =>
              setAreasShown({ runId: testRun.id, shown })
            }
          />
        }
      />
      {noiseless && !areas.editing && (
        <NoiselessBanner
          view={noiselessView}
          caveat={noiselessCaveat(analysis)}
          outlined={patches.length}
          onSwitchToDiff={() => view.setMode("diff")}
        />
      )}
      <ComparisonPanels
        testRun={testRun}
        view={view}
        areas={areas}
        leftRef={stage.leftItemRef}
        rightRef={stage.rightItemRef}
        stageProps={stage.stageProps}
        baseline={[baselineImage, baselineImageStatus]}
        checkpoint={[currentImage, currentImageStatus]}
        diff={
          (noiseless && noiselessPanelImage()) || [diffImage, diffImageStatus]
        }
        hintAreas={hintAreas}
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
