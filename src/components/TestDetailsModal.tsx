import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Switch,
  IconButton,
  Paper,
  Box,
  makeStyles,
} from "@material-ui/core";
import { ToggleButton } from "@material-ui/lab";
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
import {
  Close,
  Add,
  Delete,
  Save,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
} from "@material-ui/icons";
import { TestRunDetails } from "./TestRunDetails";
import useImage from "use-image";
import { routes } from "../constants";
import { useTestRunDispatch, updateTestRun, selectTestRun } from "../contexts";
import { DrawArea } from "./DrawArea";
import { CommentsPopper } from "./CommentsPopper";

const useStyles = makeStyles((theme) => ({
  imageContainer: {
    overflow: "hidden",
  },
}));

const defaultStagePos = {
  x: 0,
  y: 0,
};

const TestDetailsModal: React.FunctionComponent<{
  testRun: TestRun;
}> = ({ testRun }) => {
  const classes = useStyles();
  const history = useHistory();
  const testRunDispatch = useTestRunDispatch();

  const stageWidth = (window.innerWidth / 2) * 0.9;
  const stageHeigth = window.innerHeight;
  const stageScaleBy = 1.2;
  const [stageScale, setStageScale] = React.useState(1);
  const [stagePos, setStagePos] = React.useState(defaultStagePos);
  const [stageInitPos, setStageInitPos] = React.useState(defaultStagePos);
  const [stageOffset, setStageOffset] = React.useState(defaultStagePos);

  const [image] = useImage(
    testRun.imageName && staticService.getImage(testRun.imageName)
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
      ? Math.min(stageWidth / image.width, stageHeigth / image.height)
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
              <Switch
                checked={isDiffShown}
                onChange={() => setIsDiffShown(!isDiffShown)}
                name="Show diff"
              />
            </Grid>
            {(testRun.status === TestStatus.unresolved ||
              testRun.status === TestStatus.new) && (
              <Grid item>
                <Button
                  color="inherit"
                  onClick={() =>
                    testRunService.approve(testRun.id).then((testRun) => {
                      updateTestRun(testRunDispatch, testRun);
                    })
                  }
                >
                  Approve
                </Button>
                <Button
                  color="secondary"
                  onClick={() =>
                    testRunService.reject(testRun.id).then((testRun) => {
                      updateTestRun(testRunDispatch, testRun);
                    })
                  }
                >
                  Reject
                </Button>
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
        <Grid container spacing={2}>
          <Grid item>
            <Paper variant="outlined">
              <TestRunDetails testRun={testRun} />
            </Paper>
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
            <CommentsPopper text={testRun.comment}/>
          </Grid>
          <Grid item>
            <Paper variant="outlined">
              <Grid container justify="center">
                <Grid item xs={12}>
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
                    onClick={() => {
                      // update in test run
                      testRunService
                        .setIgnoreAreas(testRun.id, ignoreAreas)
                        .then(() =>
                          // recalculate diff
                          testRunService
                            .recalculateDiff(testRun.id)
                            .then((testRun) =>
                              updateTestRun(testRunDispatch, testRun)
                            )
                        );

                      // update in variation
                      testVariationService.setIgnoreAreas(
                        testRun.testVariationId,
                        ignoreAreas
                      );
                    }}
                  >
                    <Save />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item>
            <Paper variant="outlined">
              <Grid container justify="center">
                <Grid item xs={12}>
                  <Typography variant="subtitle1" align="center">
                    Scale
                  </Typography>
                </Grid>
                <Grid item>
                  <IconButton
                    onClick={() => setStageScale(stageScale * stageScaleBy)}
                  >
                    <ZoomIn />
                  </IconButton>
                </Grid>
                <Grid item>
                  <IconButton
                    onClick={() => setStageScale(stageScale / stageScaleBy)}
                  >
                    <ZoomOut />
                  </IconButton>
                </Grid>
                <Grid item>
                  <IconButton onClick={() => setOriginalSize()}>
                    <Fullscreen />
                  </IconButton>
                </Grid>
                <Grid item>
                  <IconButton onClick={fitStageToScreen}>
                    <FullscreenExit />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      <Grid container>
        <Grid item xs={6} className={classes.imageContainer}>
          <DrawArea
            type="Baseline"
            imageName={testRun.baselineName}
            ignoreAreas={[]}
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
        <Grid item xs={6} className={classes.imageContainer}>
          {isDiffShown ? (
            <DrawArea
              type="Diff"
              imageName={testRun.diffName}
              ignoreAreas={ignoreAreas}
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
              ignoreAreas={ignoreAreas}
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
    </React.Fragment>
  );
};

export default TestDetailsModal;
