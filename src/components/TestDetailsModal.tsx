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
  Tooltip,
} from "@material-ui/core";
import { ToggleButton } from "@material-ui/lab";
import { useHotkeys } from "react-hotkeys-hook";
import { TestRun } from "../types";
import {
  testRunService,
  testVariationService,
  staticService,
} from "../services";
import { TestStatus } from "../types/testStatus";
import { useHistory, Prompt } from "react-router-dom";
import { IgnoreArea } from "../types/ignoreArea";
import { KonvaEventObject } from "konva/types/Node";
import { Close, Add, Delete, Save, WarningRounded } from "@material-ui/icons";
import { TestRunDetails } from "./TestRunDetails";
import useImage from "use-image";
import { routes } from "../constants";
import { useTestRunDispatch, selectTestRun } from "../contexts";
import { DrawArea } from "./DrawArea";
import { CommentsPopper } from "./CommentsPopper";
import { useSnackbar } from "notistack";
import { ScaleActionsSpeedDial } from "./ZoomSpeedDial";
import { ApproveRejectButtons } from "./ApproveRejectButtons";

const defaultStagePos = {
  x: 0,
  y: 0,
};

const useStyles = makeStyles((theme) => ({
  drawAreaContainer: {
    width: "100%",
    backgroundColor: "#f5f5f5",
  },
  drawAreaItem: {
    padding: theme.spacing(0.5),
    height: "100%",
  },
}));

const TestDetailsModal: React.FunctionComponent<{
  testRun: TestRun;
}> = ({ testRun }) => {
  const classes = useStyles();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const testRunDispatch = useTestRunDispatch();

  const stageWidth = (window.innerWidth / 2) * 0.8;
  const stageHeigth = window.innerHeight * 0.6;
  const stageScaleBy = 1.2;
  const [stageScale, setStageScale] = React.useState(1);
  const [stagePos, setStagePos] = React.useState(defaultStagePos);
  const [stageInitPos, setStageInitPos] = React.useState(defaultStagePos);
  const [stageOffset, setStageOffset] = React.useState(defaultStagePos);

  const [image, imageStatus] = useImage(
    staticService.getImage(testRun.imageName)
  );
  const [baselineImage, baselineImageStatus] = useImage(
    staticService.getImage(testRun.baselineName)
  );
  const [diffImage, diffImageStatus] = useImage(
    staticService.getImage(testRun.diffName)
  );

  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isDiffShown, setIsDiffShown] = useState(false);
  const [selectedRectId, setSelectedRectId] = React.useState<string>();

  const [ignoreAreas, setIgnoreAreas] = React.useState<IgnoreArea[]>(
    JSON.parse(testRun.ignoreAreas)
  );

  const removeSelection = (event: KonvaEventObject<MouseEvent>) => {
    // deselect when clicked not on Rect
    const isRectClicked = event.target.className === "Rect";
    if (!isRectClicked) {
      setSelectedRectId(undefined);
    }
  };

  const deleteIgnoreArea = (id: string) => {
    setIgnoreAreas(ignoreAreas.filter((area) => area.id !== id));
    setSelectedRectId(undefined);
  };

  const handleClose = () => {
    history.push({
      search: `buildId=${testRun.buildId}`,
    });
    selectTestRun(testRunDispatch, undefined);
  };

  const isIgnoreAreasSaved = () => {
    return testRun.ignoreAreas === JSON.stringify(ignoreAreas);
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

  React.useEffect(() => {
    setIgnoreAreas(JSON.parse(testRun.ignoreAreas));
  }, [testRun]);

  React.useEffect(() => {
    fitStageToScreen();
    // eslint-disable-next-line
  }, [image]);

  React.useEffect(() => {
    setIsDiffShown(!!testRun.diffName);
  }, [testRun.diffName]);

  const isImageSizeDiffer = React.useMemo(
    () =>
      testRun.baselineName &&
      testRun.imageName &&
      (image?.height !== baselineImage?.height ||
        image?.width !== baselineImage?.width),
    [image, baselineImage, testRun.baselineName, testRun.imageName]
  );

  useHotkeys("d", () => setIsDiffShown((isDiffShown) => !isDiffShown));
  useHotkeys("ESC", () => handleClose());

  return (
    <React.Fragment>
      <Prompt
        when={!isIgnoreAreasSaved()}
        message={`You have unsaved changes that will be lost`}
      />
      <AppBar position="sticky">
        <Toolbar>
          <Grid container justify="space-between">
            <Grid item>
              <Typography variant="h6">{testRun.name}</Typography>
            </Grid>
            <Grid item>
              <Tooltip title={"Hotkey: D"}>
                <Switch
                  checked={isDiffShown}
                  onChange={() => setIsDiffShown(!isDiffShown)}
                  name="Toggle diff"
                />
              </Tooltip>
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
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Typography variant="subtitle1" align="center">
                  Ignore areas
                </Typography>
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
                  disabled={!selectedRectId}
                  onClick={() =>
                    selectedRectId && deleteIgnoreArea(selectedRectId)
                  }
                >
                  <Delete />
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton
                  disabled={isIgnoreAreasSaved()}
                  onClick={() =>
                    Promise.all([
                      // update in test run
                      testRunService.setIgnoreAreas(testRun.id, ignoreAreas),
                      // update in variation
                      testVariationService.setIgnoreAreas(
                        testRun.testVariationId,
                        ignoreAreas
                      ),
                    ])
                      .then(() => {
                        enqueueSnackbar("Ignore areas are updated", {
                          variant: "success",
                        });
                      })
                      .catch((err) =>
                        enqueueSnackbar(err, {
                          variant: "error",
                        })
                      )
                  }
                >
                  <Save />
                </IconButton>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Button
              color="primary"
              onClick={() => {
                history.push(
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
                Promise.all([
                  // update in test run
                  testRunService.setComment(testRun.id, comment),
                  // update in variation
                  testVariationService.setComment(
                    testRun.testVariationId,
                    comment
                  ),
                ])
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
        minHeight="65%"
        className={classes.drawAreaContainer}
      >
        <Grid container style={{ height: "100%" }}>
          <Grid item xs={6} className={classes.drawAreaItem}>
            <DrawArea
              type="Baseline"
              imageName={testRun.baselineName}
              branchName={testRun.baselineBranchName}
              imageState={[baselineImage, baselineImageStatus]}
              ignoreAreas={[]}
              tempIgnoreAreas={[]}
              setIgnoreAreas={setIgnoreAreas}
              selectedRectId={selectedRectId}
              setSelectedRectId={setSelectedRectId}
              onStageClick={removeSelection}
              stageScaleState={[stageScale, setStageScale]}
              stagePosState={[stagePos, setStagePos]}
              stageInitPosState={[stageInitPos, setStageInitPos]}
              stageOffsetState={[stageOffset, setStageOffset]}
              drawModeState={[false, setIsDrawMode]}
            />
          </Grid>
          <Grid item xs={6} className={classes.drawAreaItem}>
            {isDiffShown ? (
              <DrawArea
                type="Diff"
                imageName={testRun.diffName}
                branchName={testRun.branchName}
                imageState={[diffImage, diffImageStatus]}
                ignoreAreas={ignoreAreas}
                tempIgnoreAreas={JSON.parse(testRun.tempIgnoreAreas)}
                setIgnoreAreas={setIgnoreAreas}
                selectedRectId={selectedRectId}
                setSelectedRectId={setSelectedRectId}
                onStageClick={removeSelection}
                stageScaleState={[stageScale, setStageScale]}
                stagePosState={[stagePos, setStagePos]}
                stageInitPosState={[stageInitPos, setStageInitPos]}
                stageOffsetState={[stageOffset, setStageOffset]}
                drawModeState={[isDrawMode, setIsDrawMode]}
              />
            ) : (
              <DrawArea
                type="Image"
                imageName={testRun.imageName}
                branchName={testRun.branchName}
                imageState={[image, imageStatus]}
                ignoreAreas={ignoreAreas}
                tempIgnoreAreas={JSON.parse(testRun.tempIgnoreAreas)}
                setIgnoreAreas={setIgnoreAreas}
                selectedRectId={selectedRectId}
                setSelectedRectId={setSelectedRectId}
                onStageClick={removeSelection}
                stageScaleState={[stageScale, setStageScale]}
                stagePosState={[stagePos, setStagePos]}
                stageInitPosState={[stageInitPos, setStageInitPos]}
                stageOffsetState={[stageOffset, setStageOffset]}
                drawModeState={[isDrawMode, setIsDrawMode]}
              />
            )}
          </Grid>
        </Grid>
      </Box>
      <ScaleActionsSpeedDial
        onZoomInClick={() => setStageScale(stageScale * stageScaleBy)}
        onZoomOutClick={() => setStageScale(stageScale / stageScaleBy)}
        onOriginalSizeClick={setOriginalSize}
        onFitIntoScreenClick={fitStageToScreen}
      />
    </React.Fragment>
  );
};

export default TestDetailsModal;
