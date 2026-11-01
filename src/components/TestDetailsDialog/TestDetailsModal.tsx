import { useEffect, useState, Fragment, useMemo, useRef } from "react";
import {
  Typography,
  Button,
  GridLegacy as Grid,
  Switch,
  IconButton,
  Box,
  Select,
  MenuItem,
  LinearProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  ToggleButton,
  SelectChangeEvent,
  Slider,
  Tooltip as MuiTooltip,
} from "@mui/material";
import { useHotkeys } from "react-hotkeys-hook";
import { hotkeyOptions } from "../../_helpers/hotkeys.helper";
import { TestRun } from "../../types";
import { testRunService, staticService } from "../../services";
import { TestStatus } from "../../types/testStatus";
import { IgnoreArea, UpdateIgnoreAreaDto } from "../../types/ignoreArea";
import Konva from "konva";
import {
  Close,
  Add,
  Delete,
  Save,
  WarningRounded,
  LayersClear,
  Compare,
  Collections,
  OpenInNew,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
  NavigateNext,
  NavigateBefore,
} from "@mui/icons-material";
import { TestRunDetails } from "./TestRunDetails";
import useImage from "use-image";
import { routes, GO_TO_NEXT_KEY } from "../../constants";
import { useTestRunDispatch, useProjectState } from "../../contexts";
import { DrawArea, ImageStateLoad } from "./DrawArea";
import { CommentsPopper } from "../CommentsPopper";
import { useDialogSnackbar } from "./useDialogSnackbar";
import { ApproveRejectButtons } from "./ApproveRejectButtons";
import {
  MatchingVariationsDialog,
  MatchingVariationsMode,
} from "./MatchingVariationsDialog";
import { invertIgnoreArea } from "../../_helpers/ignoreArea.helper";
import { BaseModal } from "../BaseModal";
import { Tooltip } from "../Tooltip";
import ImageDetails, { ImageDetailsProps } from "./ImageDetails";
import { calculateScale, clampScale } from "../../_helpers/scale.helper";
import { canCompareToBaseline } from "../../_helpers/testRunStatus.helper";
import TestStatusChip from "../TestStatusChip";

const headerSx = {
  position: "relative",
  textAlign: "left",
  bgcolor: "background.default",
  paddingLeft: "8px",
  paddingBottom: "8px",
} as const;
const footerSx = { bgcolor: "background.default" } as const;
const scaleActionsSx = { display: "flex", alignItems: "center" } as const;
const testRunActionsSx = {
  display: "flex",
  alignItems: "center",
  alignContent: "center",
} as const;
const centerActionsSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "4px",
} as const;
const testRunNameSx = { fontWeight: 300 } as const;
const closeIconSx = { position: "absolute", right: "8px" } as const;
const testRunDetailsSx = { paddingLeft: "8px" } as const;
const drawAreaContainerSx = { width: "100%", height: "100%" } as const;
const drawAreaItemSx = { padding: "0 4px", height: "100%" } as const;
const imageToolbarSx = { paddingLeft: "5px", height: "52px" } as const;

const defaultStagePos = {
  x: 0,
  y: 0,
};

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
  const { enqueueSnackbar } = useDialogSnackbar();
  const testRunDispatch = useTestRunDispatch();
  const { selectedProjectId, projectList } = useProjectState();
  const project = projectList.find((item) => item.id === selectedProjectId);
  const [variationsMode, setVariationsMode] =
    useState<MatchingVariationsMode | null>(null);

  const stageScaleBy = 1.2;
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState(defaultStagePos);
  const [stageScrollPos, setStageScrollPos] = useState(defaultStagePos);
  const [stageInitPos, setStageInitPos] = useState(defaultStagePos);
  const [stageOffset, setStageOffset] = useState(defaultStagePos);
  const [processing, setProcessing] = useState(false);
  const [isDrawMode, setIsDrawMode] = useState(false);

  const [valueOfIgnoreOrCompare, setValueOfIgnoreOrCompare] =
    useState("Ignore Areas");

  const [isDiffShown, setIsDiffShown] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [blendDifference, setBlendDifference] = useState(false);
  const [selectedRectId, setSelectedRectId] = useState<string>();
  const [ignoreAreas, setIgnoreAreas] = useState<IgnoreArea[]>([]);

  const [applyIgnoreDialogOpen, setApplyIgnoreDialogOpen] = useState(false);

  const [goToNextAutomatically, setGoToNextAutomatically] = useState(() => {
    const json = localStorage.getItem(GO_TO_NEXT_KEY);

    if (json) {
      return JSON.parse(json);
    }

    return false;
  });

  useEffect(() => {
    localStorage.setItem(GO_TO_NEXT_KEY, JSON.stringify(goToNextAutomatically));
  }, [goToNextAutomatically]);

  const handleGoToNextAutomatically = () => {
    if (goToNextAutomatically) {
      handleNext();
    }
  };

  const leftItemRef = useRef<HTMLDivElement>(null);
  const rightItemRef = useRef<HTMLDivElement>(null);

  const toggleApplyIgnoreDialogOpen = () => {
    setApplyIgnoreDialogOpen(!applyIgnoreDialogOpen);
  };

  const [currentImage, currentImageStatus] = useImage(
    staticService.getImage(testRun.imageName),
  );

  const [baselineImage, baselineImageStatus] = useImage(
    staticService.getImage(testRun.baselineName),
  );

  const [diffImage, diffImageStatus] = useImage(
    staticService.getImage(testRun.diffName),
  );

  const applyIgnoreAreaText =
    "Apply selected ignore area to all images in this build.";

  const fitImageToStage = (image: HTMLImageElement, container: HTMLElement) =>
    calculateScale(
      image.width + 20,
      image.height + 20,
      container.offsetWidth,
      container.offsetHeight - 48,
    );

  // one scale for both panes, set by the largest image; capped at 1 so small ones stay put
  const fitScale = (): number | undefined => {
    const scales: number[] = [];

    if (currentImage && leftItemRef.current) {
      scales.push(fitImageToStage(currentImage, leftItemRef.current));
    }

    if (baselineImage && rightItemRef.current) {
      scales.push(fitImageToStage(baselineImage, rightItemRef.current));
    }

    return scales.length > 0 ? Math.min(1, ...scales) : undefined;
  };

  const fitImagesToStage = () => {
    const scale = fitScale();
    if (scale !== undefined) {
      setStageScale(scale);
    }
    resetPosition();
  };

  // per-run view state; this dialog is not remounted between runs
  useEffect(() => {
    setIsDiffShown(!!testRun.diffName);
    setOverlayOpacity(1);
    setBlendDifference(false);
    setIsDrawMode(false);
    setSelectedRectId(undefined);
  }, [testRun.id, testRun.diffName]);

  // by id, not the run object: an update to the run would wipe the unsaved areas drawn here
  useEffect(() => {
    setIgnoreAreas(JSON.parse(testRun.ignoreAreas));
  }, [testRun.id, testRun.ignoreAreas]);

  // the next run keeps the reviewer's zoom and place when its images are the same size
  const fittedSizes = useRef<string>(undefined);
  useEffect(() => {
    if (currentImageStatus === "loading" || baselineImageStatus === "loading") {
      return;
    }
    const sizes = [currentImage, baselineImage]
      .map((image) => (image ? `${image.width}x${image.height}` : "-"))
      .join("|");
    if (sizes === fittedSizes.current) {
      return;
    }
    fittedSizes.current = sizes;
    fitImagesToStage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baselineImage, currentImage, currentImageStatus, baselineImageStatus]);

  useHotkeys("right", handleNext, hotkeyOptions, [currentRunIndex, handleNext]);
  useHotkeys("left", handlePrevious, hotkeyOptions, [
    currentRunIndex,
    handlePrevious,
  ]);

  const tempIgnoreAreas = useMemo<IgnoreArea[]>(
    () => JSON.parse(testRun.tempIgnoreAreas),
    [testRun.tempIgnoreAreas],
  );

  const isImageSizeDiffer = useMemo(
    () =>
      testRun.baselineName &&
      testRun.imageName &&
      (currentImage?.height !== baselineImage?.height ||
        currentImage?.width !== baselineImage?.width),
    [currentImage, baselineImage, testRun.baselineName, testRun.imageName],
  );

  const handleIgnoreAreaChange = (ignoreAreas: IgnoreArea[]) => {
    setIgnoreAreas(ignoreAreas);
    testRunDispatch({
      type: "touched",
      payload: testRun.ignoreAreas !== JSON.stringify(ignoreAreas),
    });
  };

  const removeSelection = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const isRectClicked = event.target.className === "Rect";

    if (!isRectClicked) {
      setSelectedRectId(undefined);
    }
  };

  const deleteIgnoreArea = (id: string) => {
    handleIgnoreAreaChange(ignoreAreas.filter((area) => area.id !== id));
    setSelectedRectId(undefined);
  };

  const saveTestRun = (ignoreAreas: IgnoreArea[], successMessage: string) => {
    testRunService
      .updateIgnoreAreas({
        ids: [testRun.id],
        ignoreAreas,
      })
      .then(() => {
        enqueueSnackbar(successMessage, {
          variant: "success",
        });
        // only once stored: a failed save must leave the areas unsaved
        testRunDispatch({
          type: "touched",
          payload: false,
        });
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
  };

  const saveIgnoreAreasOrCompareArea = () => {
    if (valueOfIgnoreOrCompare.includes("Ignore")) {
      saveTestRun(ignoreAreas, "Ignore areas are updated.");
    } else if (currentImage) {
      const invertedIgnoreAreas = invertIgnoreArea(
        currentImage.width,
        currentImage.height,
        ignoreAreas[ignoreAreas.length - 1],
      );

      handleIgnoreAreaChange(invertedIgnoreAreas);
      saveTestRun(
        invertedIgnoreAreas,
        "Selected area has been inverted to ignore areas and saved.",
      );
    }
  };

  const onIgnoreOrCompareSelectChange = (value: string) => {
    if (value.includes("Compare")) {
      setValueOfIgnoreOrCompare("Compare Area");
    } else {
      setValueOfIgnoreOrCompare("Ignore Areas");
    }
  };

  const setOriginalSize = () => {
    setStageScale(1);
    resetPosition();
  };

  const resetPosition = () => {
    setStagePos(defaultStagePos);
    setStageOffset(defaultStagePos);
  };

  const applyIgnoreArea = () => {
    const newIgnoreArea = ignoreAreas.find(
      (area) => selectedRectId === area.id,
    );

    if (newIgnoreArea) {
      setProcessing(true);
      testRunService
        .getList(testRun.buildId)
        .then((testRuns: TestRun[]) => {
          const allIds = testRuns.map((item) => item.id);
          const data: UpdateIgnoreAreaDto = {
            ids: allIds,
            ignoreAreas: [newIgnoreArea],
          };

          return testRunService.addIgnoreAreas(data);
        })
        .then(() => {
          setProcessing(false);
          setSelectedRectId(undefined);
          enqueueSnackbar(
            "Ignore areas are updated in all images in this build.",
            {
              variant: "success",
            },
          );
        })
        .catch((error) => {
          enqueueSnackbar(`There was an error : ${error}`, {
            variant: "error",
          });
          setProcessing(false);
        });
    } else {
      enqueueSnackbar(
        "There was an error determining which ignore area to apply.",
        {
          variant: "error",
        },
      );
    }
  };

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

  const ignoreAreasToolbar = () => (
    <Fragment>
      <Grid container alignItems="center" spacing={2}>
        <Grid item>
          <Select
            variant="standard"
            id="area-select"
            labelId="areaSelect"
            // a standard select underlines itself and would read as a text field among buttons
            sx={{
              "&:before, &:after, &:hover:not(.Mui-disabled):before": {
                borderBottom: "none",
              },
            }}
            value={valueOfIgnoreOrCompare}
            onChange={(event: SelectChangeEvent<string>) =>
              onIgnoreOrCompareSelectChange(event.target.value)
            }
          >
            {["Ignore Areas", "Compare Area"].map((eachItem) => (
              <MenuItem key={eachItem} value={eachItem}>
                {eachItem}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item>
          <ToggleButton
            value={"drawMode"}
            selected={isDrawMode}
            size="small"
            onClick={() => {
              setIsDrawMode(!isDrawMode);
            }}
            style={{
              padding: 4,
            }}
          >
            <Add data-testid="AddIcon" />
          </ToggleButton>
        </Grid>
        <Grid item>
          <IconButton
            size="small"
            disabled={!selectedRectId || ignoreAreas.length === 0}
            onClick={() => selectedRectId && deleteIgnoreArea(selectedRectId)}
          >
            <Delete data-testid="DeleteIcon" />
          </IconButton>
        </Grid>
        <Tooltip title="Clears all ignore areas." aria-label="reject">
          <Grid item>
            <IconButton
              size="small"
              disabled={ignoreAreas.length === 0}
              onClick={() => {
                handleIgnoreAreaChange([]);
              }}
            >
              <LayersClear data-testid="LayersClearIcon" />
            </IconButton>
          </Grid>
        </Tooltip>
        <Tooltip title={applyIgnoreAreaText} aria-label="apply ignore area">
          <Grid item>
            <IconButton
              size="small"
              disabled={!selectedRectId || ignoreAreas.length === 0}
              onClick={() => toggleApplyIgnoreDialogOpen()}
            >
              <Collections data-testid="CollectionsIcon" />
            </IconButton>
          </Grid>
        </Tooltip>
        <Grid item>
          <IconButton
            size="small"
            disabled={!touched}
            onClick={() => saveIgnoreAreasOrCompareArea()}
          >
            <Save data-testid="SaveIcon" />
          </IconButton>
        </Grid>
      </Grid>
    </Fragment>
  );

  const baselinePanel = () => (
    <Grid
      item
      xs={6}
      ref={leftItemRef}
      sx={drawAreaItemSx}
      alignItems="stretch"
    >
      <Grid container alignItems="center" spacing={1} sx={imageToolbarSx}>
        <ImageDetails
          type="Baseline"
          branchName={testRun.baselineBranchName}
          imageName={testRun.baselineName}
          image={baselineImage}
          ignoreAreas={[]}
        />
        <Grid item>
          <Button
            color="primary"
            disabled={!testRun.testVariationId}
            onClick={openHistoryTab}
          >
            History <OpenInNew fontSize="small" />
          </Button>
        </Grid>
      </Grid>
      <Grid
        item
        style={{
          flexGrow: "1",
        }}
      >
        <DrawArea
          imageName={testRun.baselineName}
          imageState={[baselineImage, baselineImageStatus]}
          ignoreAreas={[]}
          tempIgnoreAreas={[]}
          setIgnoreAreas={handleIgnoreAreaChange}
          selectedRectId={selectedRectId}
          setSelectedRectId={setSelectedRectId}
          onStageClick={removeSelection}
          stageScaleState={[stageScale, setStageScale]}
          stagePosState={[stagePos, setStagePos]}
          stageScrollPosState={[stageScrollPos, setStageScrollPos]}
          stageInitPosState={[stageInitPos, setStageInitPos]}
          stageOffsetState={[stageOffset, setStageOffset]}
          drawModeState={[false, setIsDrawMode]}
        />
      </Grid>
    </Grid>
  );

  const diffPanel = (
    type: ImageDetailsProps["type"],
    branchName: string,
    imageName: string | null,
    imageStatus: ImageStateLoad,
    image: HTMLImageElement | undefined,
  ) => (
    <Grid item xs={6} sx={drawAreaItemSx} ref={rightItemRef}>
      <Grid container alignItems="center" spacing={1} sx={imageToolbarSx}>
        <ImageDetails
          type={type}
          branchName={branchName}
          imageName={imageName}
          image={image}
          ignoreAreas={tempIgnoreAreas}
        />
        {testRun.diffName && (
          <Grid item>
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
        {/* a plain flex row, not a nested Grid, whose spacing lifts the controls off the line */}
        <Grid item xs minWidth={0}>
          {canCompareToBaseline(testRun) && (
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
                      value={overlayOpacity}
                      onChange={(_event, value) => {
                        setOverlayOpacity(value);
                        setIsDiffShown(false);
                      }}
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
                  onChange={() => {
                    setBlendDifference((blend) => !blend);
                    setIsDiffShown(false);
                  }}
                  data-testid="differenceToggle"
                  style={{ padding: 4, marginLeft: 8 }}
                >
                  <Compare fontSize="small" />
                </ToggleButton>
              </MuiTooltip>
            </Box>
          )}
        </Grid>
      </Grid>
      <DrawArea
        imageName={imageName}
        imageState={[image, imageStatus]}
        underlayImage={isDiffShown ? undefined : baselineImage}
        overlayOpacity={overlayOpacity}
        blendDifference={blendDifference && !isDiffShown}
        ignoreAreas={ignoreAreas}
        tempIgnoreAreas={tempIgnoreAreas}
        setIgnoreAreas={handleIgnoreAreaChange}
        selectedRectId={selectedRectId}
        deleteIgnoreArea={deleteIgnoreArea}
        setSelectedRectId={setSelectedRectId}
        onStageClick={removeSelection}
        stageScaleState={[stageScale, setStageScale]}
        stagePosState={[stagePos, setStagePos]}
        stageScrollPosState={[stageScrollPos, setStageScrollPos]}
        stageInitPosState={[stageInitPos, setStageInitPos]}
        stageOffsetState={[stageOffset, setStageOffset]}
        drawModeState={[isDrawMode, setIsDrawMode]}
      />
    </Grid>
  );

  const header = () => (
    <Box mt={1} ml={1}>
      <Grid container alignItems="center" sx={headerSx} spacing={2}>
        <Grid item>
          <Typography variant="h6" display="inline">{`Step ${
            currentRunIndex + 1
          }/${totalTestRunCount}: `}</Typography>
          <Typography variant="h6" display="inline" sx={testRunNameSx}>
            {testRun.name}
          </Typography>
        </Grid>
        <Grid item>
          <TestStatusChip status={testRun.status} />
        </Grid>
        <Grid item sx={closeIconSx}>
          <IconButton color="inherit" onClick={handleClose} size="large">
            <Close data-testid="CloseIcon" />
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  );

  const testRunDetails = () => (
    <Box ml={1} mr={1} mt={0} mb={0}>
      <Grid container alignItems="center" sx={testRunDetailsSx} spacing={1}>
        <TestRunDetails testRun={testRun} />
        {isImageSizeDiffer && (
          <Grid item>
            <Tooltip
              title={
                "Image height/width differ from baseline! Cannot calculate diff!"
              }
            >
              <IconButton size="large">
                <WarningRounded
                  data-testid="WarningRoundedIcon"
                  color="secondary"
                />
              </IconButton>
            </Tooltip>
          </Grid>
        )}
        <Grid item style={{ marginLeft: "auto" }}>
          {ignoreAreasToolbar()}
        </Grid>
        <Grid item>
          <CommentsPopper
            text={testRun.comment}
            onSave={(comment) =>
              testRunService
                .update(testRun.id, {
                  comment,
                })
                .then(() =>
                  enqueueSnackbar("Comment updated", {
                    variant: "success",
                  }),
                )
                .catch((err) => {
                  enqueueSnackbar(err, {
                    variant: "error",
                  });
                  // still a failure, so the comment box stays open
                  throw err;
                })
            }
          />
        </Grid>
      </Grid>
      <Divider />
    </Box>
  );

  return (
    <>
      {header()}
      <Divider />
      {processing && <LinearProgress />}
      {testRunDetails()}
      <Box overflow="hidden" position="relative" sx={drawAreaContainerSx}>
        <Grid
          container
          justifyContent="center"
          alignItems="stretch"
          style={{
            height: "100%",
          }}
        >
          {baselinePanel()}
          {isDiffShown
            ? diffPanel(
                "Diff",
                testRun.branchName,
                testRun.diffName,
                diffImageStatus,
                diffImage,
              )
            : diffPanel(
                "Image",
                testRun.branchName,
                testRun.imageName,
                currentImageStatus,
                currentImage,
              )}
        </Grid>
      </Box>
      <Grid container sx={footerSx}>
        <Grid item xs={3} sx={scaleActionsSx}>
          <Tooltip title={"Zoom In"}>
            <IconButton
              onClick={() =>
                setStageScale(clampScale(stageScale * stageScaleBy))
              }
              size="large"
            >
              <ZoomIn data-testid="ZoomInIcon" />
            </IconButton>
          </Tooltip>
          <Tooltip title={"Zoom Out"}>
            <IconButton
              onClick={() =>
                setStageScale(clampScale(stageScale / stageScaleBy))
              }
              size="large"
            >
              <ZoomOut data-testid="ZoomOutIcon" />
            </IconButton>
          </Tooltip>
          <Tooltip title={"Original size"}>
            <IconButton onClick={setOriginalSize} size="large">
              <Fullscreen data-testid="FullscreenIcon" />
            </IconButton>
          </Tooltip>
          <Tooltip title={"Fit into screen"}>
            <IconButton onClick={fitImagesToStage} size="large">
              <FullscreenExit data-testid="FullscreenExitIcon" />
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid item xs={6} sx={centerActionsSx}>
          <Tooltip title={"Hotkey: ArrowLeft"}>
            <IconButton
              color="secondary"
              style={{
                visibility: currentRunIndex > 0 ? "visible" : "hidden",
              }}
              onClick={handlePrevious}
              size="large"
            >
              <NavigateBefore />
            </IconButton>
          </Tooltip>
          {(testRun.status === TestStatus.unresolved ||
            testRun.status === TestStatus.new) && (
            <ApproveRejectButtons
              testRun={testRun}
              afterApprove={handleGoToNextAutomatically}
              afterReject={handleGoToNextAutomatically}
              onOpenVariations={setVariationsMode}
            />
          )}
          <Tooltip title={"Hotkey: ArrowRight"}>
            <IconButton
              color="secondary"
              style={{
                visibility:
                  totalTestRunCount > currentRunIndex + 1
                    ? "visible"
                    : "hidden",
              }}
              onClick={handleNext}
              size="large"
            >
              <NavigateNext />
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid item xs={3} sx={testRunActionsSx} justifyContent="flex-end">
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                size="small"
                checked={goToNextAutomatically}
                onChange={(e) => setGoToNextAutomatically(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2" color="textSecondary">
                Go to the next after Approve/Reject
              </Typography>
            }
          />
        </Grid>
      </Grid>
      <BaseModal
        open={applyIgnoreDialogOpen}
        title={applyIgnoreAreaText}
        submitButtonText={"Yes"}
        onCancel={toggleApplyIgnoreDialogOpen}
        content={
          <Typography>
            {`All images in the current build will be re-compared with new ignore area taken into account. Are you sure?`}
          </Typography>
        }
        onSubmit={() => {
          toggleApplyIgnoreDialogOpen();
          applyIgnoreArea();
        }}
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
