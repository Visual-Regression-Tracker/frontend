import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Switch,
  IconButton,
  Box,
  makeStyles,
  Select,
  MenuItem,
  LinearProgress,
} from "@material-ui/core";
import { ToggleButton } from "@material-ui/lab";
import { useHotkeys } from "react-hotkeys-hook";
import { TestRun } from "../../types";
import { testRunService, staticService } from "../../services";
import { TestStatus } from "../../types/testStatus";
import { useNavigate } from "react-router-dom";
import { IgnoreArea, UpdateIgnoreAreaDto } from "../../types/ignoreArea";
import { KonvaEventObject } from "konva/types/Node";
import {
  Close,
  Add,
  Delete,
  Save,
  WarningRounded,
  LayersClear,
  Collections,
} from "@material-ui/icons";
import { TestRunDetails } from "../TestRunDetails";
import useImage from "use-image";
import { routes } from "../../constants";
import { useTestRunDispatch } from "../../contexts";
import { DrawArea } from "./DrawArea";
import { CommentsPopper } from "../CommentsPopper";
import { useSnackbar } from "notistack";
import { ScaleActionsSpeedDial } from "../ZoomSpeedDial";
import { ApproveRejectButtons } from "../ApproveRejectButtons";
import { head } from "lodash";
import { invertIgnoreArea } from "../../_helpers/ignoreArea.helper";
import { BaseModal } from "../BaseModal";
import { Tooltip } from "../Tooltip";
import ImageDetails from "../ImageDetails";


const defaultStagePos = {
  x: 0,
  y: 0,
};

const useStyles = makeStyles((theme) => ({
  drawAreaContainer: {
    width: "100%",
    height:"100%",
    backgroundColor: "#f5f5f5",
  },
  drawAreaItem: {
    padding: theme.spacing(0.5),
    height: "100%",
  },
  imageDetailsContainer: {
    backgroundColor: "white",
    zIndex: 1,
    padding: theme.spacing(1),
  },
}));

const TestDetailsModal: React.FunctionComponent<{
  testRun: TestRun;
  currentRunIndex: number;
  totalTestRunCount: number;
  touched: boolean;
  handleClose: () => void;
}> = ({ testRun, currentRunIndex, totalTestRunCount, touched, handleClose }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const testRunDispatch = useTestRunDispatch();

  const stageWidth = (window.innerWidth / 2) * 0.8;
  const stageHeigth = window.innerHeight * 0.6;
  const stageScaleBy = 1.2;
  const [stageScale, setStageScale] = React.useState(1);
  const [stagePos, setStagePos] = React.useState(defaultStagePos);
  const [stageScrollPos, setStageScrollPos] = React.useState(defaultStagePos);
  const [stageInitPos, setStageInitPos] = React.useState(defaultStagePos);
  const [stageOffset, setStageOffset] = React.useState(defaultStagePos);
  const [processing, setProcessing] = React.useState(false);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [valueOfIgnoreOrCompare, setValueOfIgnoreOrCompare] = useState(
    "Ignore Areas"
  );
  const [isDiffShown, setIsDiffShown] = useState(false);
  const [selectedRectId, setSelectedRectId] = React.useState<string>();
  const [ignoreAreas, setIgnoreAreas] = React.useState<IgnoreArea[]>([]);
  const [applyIgnoreDialogOpen, setApplyIgnoreDialogOpen] = React.useState(
    false
  );

  const toggleApplyIgnoreDialogOpen = () => {
    setApplyIgnoreDialogOpen(!applyIgnoreDialogOpen);
  };

  const [image, imageStatus] = useImage(
    staticService.getImage(testRun.imageName)
  );
  const [baselineImage, baselineImageStatus] = useImage(
    staticService.getImage(testRun.baselineName)
  );
  const [diffImage, diffImageStatus] = useImage(
    staticService.getImage(testRun.diffName)
  );

  const applyIgnoreAreaText =
    "Apply selected ignore area to all images in this build.";

  React.useEffect(() => {
    fitStageToScreen();
    // eslint-disable-next-line
  }, [image]);

  React.useEffect(() => {
    setIsDiffShown(!!testRun.diffName);
  }, [testRun.diffName]);

  React.useEffect(() => {
    setIgnoreAreas(JSON.parse(testRun.ignoreAreas));
  }, [testRun]);

  const isImageSizeDiffer = React.useMemo(
    () =>
      testRun.baselineName &&
      testRun.imageName &&
      (image?.height !== baselineImage?.height ||
        image?.width !== baselineImage?.width),
    [image, baselineImage, testRun.baselineName, testRun.imageName]
  );

  const handleIgnoreAreaChange = (ignoreAreas: IgnoreArea[]) => {
    setIgnoreAreas(ignoreAreas);
    testRunDispatch({
      type: "touched",
      payload: testRun.ignoreAreas !== JSON.stringify(ignoreAreas),
    });
  };

  const removeSelection = (event: KonvaEventObject<MouseEvent>) => {
    // deselect when clicked not on Rect
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
      })
      .catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        })
      );
  };

  const saveIgnoreAreasOrCompareArea = () => {
    if (valueOfIgnoreOrCompare.includes("Ignore")) {
      saveTestRun(ignoreAreas, "Ignore areas are updated.");
    } else {
      const invertedIgnoreAreas = invertIgnoreArea(
        image!.width,
        image!.height,
        head(ignoreAreas)
      );

      handleIgnoreAreaChange(invertedIgnoreAreas);
      saveTestRun(
        invertedIgnoreAreas,
        "Selected area has been inverted to ignore areas and saved."
      );
    }
    testRunDispatch({ type: "touched", payload: false });
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
    resetPositioin();
  };

  const fitStageToScreen = () => {
    const scale = image
      ? Math.min(
          stageWidth < image.width ? stageWidth / image.width : 1,
          stageHeigth < image.height ? stageHeigth / image.height : 1
        )
      : 1;
    setStageScale(scale);
    resetPositioin();
  };

  const resetPositioin = () => {
    setStagePos(defaultStagePos);
    setStageOffset(defaultStagePos);
  };

  const applyIgnoreArea = () => {
    let newIgnoreArea = ignoreAreas.find((area) => selectedRectId! === area.id);
    if (newIgnoreArea) {
      setProcessing(true);
      testRunService
        .getList(testRun.buildId)
        .then((testRuns: TestRun[]) => {
          let allIds = testRuns.map((item) => item.id);
          let data: UpdateIgnoreAreaDto = {
            ids: allIds,
            ignoreAreas: [newIgnoreArea!],
          };
          testRunService.addIgnoreAreas(data).then(() => {
            setProcessing(false);
            setSelectedRectId(undefined);
            enqueueSnackbar(
              "Ignore areas are updated in all images in this build.",
              {
                variant: "success",
              }
            );
          });
        })
        .catch((error) => {
          enqueueSnackbar("There was an error : " + error, {
            variant: "error",
          });
          setProcessing(false);
        });
    } else {
      enqueueSnackbar(
        "There was an error determining which ignore area to apply.",
        { variant: "error" }
      );
    }
  };

  useHotkeys(
    "d",
    () => !!testRun.diffName && setIsDiffShown((isDiffShown) => !isDiffShown),
    [testRun.diffName]
  );
  useHotkeys("ESC", handleClose, [handleClose]);

  const ignoreAreasToolbar = ()=>{
    return <>
      <Grid container alignItems="center" spacing={2}>
        <Grid item>
          <Select
            id="area-select"
            labelId="areaSelect"
            value={valueOfIgnoreOrCompare}
            onChange={(event) =>
              onIgnoreOrCompareSelectChange(event.target.value as string)
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
            onClick={() => {
              setIsDrawMode(!isDrawMode);
            }}
          >
            <Add />
          </ToggleButton>
        </Grid>
        <Grid item>
          <IconButton
            disabled={!selectedRectId || ignoreAreas.length === 0}
            onClick={() =>
              selectedRectId && deleteIgnoreArea(selectedRectId)
            }
          >
            <Delete />
          </IconButton>
        </Grid>
        <Tooltip title="Clears all ignore areas." aria-label="reject">
          <Grid item>
            <IconButton
              disabled={ignoreAreas.length === 0}
              onClick={() => {
                handleIgnoreAreaChange([]);
              }}
            >
              <LayersClear />
            </IconButton>
          </Grid>
        </Tooltip>
        <Tooltip
          title={applyIgnoreAreaText}
          aria-label="apply ignore area"
        >
          <Grid item>
            <IconButton
              disabled={!selectedRectId || ignoreAreas.length === 0}
              onClick={() => toggleApplyIgnoreDialogOpen()}
            >
              <Collections />
            </IconButton>
          </Grid>
        </Tooltip>
        <Grid item>
          <IconButton
            disabled={!touched}
            onClick={() => saveIgnoreAreasOrCompareArea()}
          >
            <Save />
          </IconButton>
        </Grid>
      </Grid>
    </>
  }

  const diffPanel=(type:any, branchName:string, imageName:string, imageStatus:any, image: undefined|HTMLImageElement)=>{
    return <>
      <Grid container alignItems="center" spacing={2}>  
          <Grid item xs={4}>
            <div className={classes.imageDetailsContainer}>
              <ImageDetails
                type={type}
                branchName={branchName}
                imageName={imageName}
                ignoreAreas={JSON.parse(testRun.tempIgnoreAreas)}
              />
            </div>
          </Grid>
          <Grid item xs={8}>{ignoreAreasToolbar()}</Grid>
      </Grid>
      <DrawArea
            imageState={[image, imageStatus]}
            ignoreAreas={ignoreAreas}
            tempIgnoreAreas={JSON.parse(testRun.tempIgnoreAreas)}
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
    </>
  }

  return (
    <React.Fragment>
      <AppBar position="sticky">
        <Toolbar>
          <Grid container justifyContent="space-between">
            <Grid item>
              <Typography variant="h6">{testRun.name}</Typography>
            </Grid>
            {testRun.diffName && (
              <Grid item>
                <Tooltip title={"Hotkey: D"}>
                  <Switch
                    checked={isDiffShown}
                    onChange={() => setIsDiffShown(!isDiffShown)}
                    name="Toggle diff"
                  />
                </Tooltip>
              </Grid>
            )}
            <Grid item>
              <Typography variant="h6">{currentRunIndex+1} of {totalTestRunCount}</Typography>
            </Grid>
            {(testRun.status === TestStatus.unresolved ||
              testRun.status === TestStatus.new) && (
              <Grid item>
                <ApproveRejectButtons testRun={testRun} />
              </Grid>
            )}
            <Grid item>
              <IconButton color="inherit" onClick={handleClose}>
                <Close />
              </IconButton>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      {processing && <LinearProgress />}
      <Box m={1}>
        <Grid container alignItems="center">
          <Grid item xs={12}>
            <Grid container alignItems="center">
              <Grid item>
                <TestRunDetails testRun={testRun} />
              </Grid>
              {isImageSizeDiffer && (
                <Grid item>
                  <Tooltip
                    title={
                      "Image height/width differ from baseline! Cannot calculate diff!"
                    }
                  >
                    <IconButton>
                      <WarningRounded color="secondary" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              )}
            </Grid>
          </Grid>
          <Grid item>
            <Button
              color="primary"
              disabled={!testRun.testVariationId}
              onClick={() => {
                navigate(
                  `${routes.VARIATION_DETAILS_PAGE}/${testRun.testVariationId}`
                );
              }}
            >
              Baseline history
            </Button>
          </Grid>
          <Grid item>
            <CommentsPopper
              text={testRun.comment}
              onSave={(comment) =>
                testRunService
                  .update(testRun.id, { comment })
                  .then(() =>
                    enqueueSnackbar("Comment updated", {
                      variant: "success",
                    })
                  )
                  .catch((err) =>
                    enqueueSnackbar(err, {
                      variant: "error",
                    })
                  )
              }
            />
          </Grid>
        </Grid>
      </Box>
      <Box
        overflow="hidden"
        position="relative"
        className={classes.drawAreaContainer}          
      >
        <Grid container justifyContent="center" alignItems="stretch">
          <Grid item xs={6} className={classes.drawAreaItem} 
            direction="column"
            alignItems="stretch">
            <div className={classes.imageDetailsContainer}>
              <ImageDetails
                type="Baseline"
                branchName={testRun.baselineBranchName}
                imageName={testRun.baselineName}
                ignoreAreas={[]}
              />
            </div>
            <DrawArea
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
          <Grid item xs={6} className={classes.drawAreaItem}>
            {isDiffShown?
             diffPanel("Diff", testRun.branchName, testRun.diffName, diffImageStatus, diffImage):
             diffPanel("Image", testRun.branchName, testRun.imageName, imageStatus, image)}
          </Grid>
        </Grid>
      </Box>
      <ScaleActionsSpeedDial
        onZoomInClick={() => setStageScale(stageScale * stageScaleBy)}
        onZoomOutClick={() => setStageScale(stageScale / stageScaleBy)}
        onOriginalSizeClick={setOriginalSize}
        onFitIntoScreenClick={fitStageToScreen}
      />
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
    </React.Fragment>
  );
};

export default TestDetailsModal;
