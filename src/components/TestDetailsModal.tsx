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
import { TestRun } from "../types";
import {
  testRunService,
  testVariationService,
  staticService,
} from "../services";
import DrawArea from "./DrawArea";
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
import ImageDetails from "./ImageDetails";
import { TestRunDetails } from "./TestRunDetails";
import useImage from "use-image";

const useStyles = makeStyles((theme) => ({
  imageContainer: {
    overflow: "hidden",
  },
  canvasContainer: {
    overflow: "hidden",
    margin: theme.spacing(1),
    padding: theme.spacing(1),
  },
}));

const defaultStagePos = {
  x: 0,
  y: 0,
};

const TestDetailsModal: React.FunctionComponent<{
  testRun: TestRun;
  updateTestRun: (testRun: TestRun) => void;
}> = ({ testRun, updateTestRun }) => {
  const classes = useStyles();
  const history = useHistory();

  const stageWidth = (window.innerWidth / 2) * 0.9;
  const stageHeigth = window.innerHeight;
  const stageScaleBy = 1.2;
  const [stageScale, setStageScale] = React.useState(1);
  const [stagePos, setStagePos] = React.useState(defaultStagePos);
  const [stageInitPos, setStageInitPos] = React.useState(defaultStagePos);
  const [stageOffset, setStageOffset] = React.useState(defaultStagePos);

  const [baseline] = useImage(staticService.getImage(testRun.baselineName));
  const [image] = useImage(staticService.getImage(testRun.imageName));
  const [diff] = useImage(staticService.getImage(testRun.diffName));

  const [isDiffShown, setIsDiffShown] = useState(!!testRun.diffName);
  const [selectedRectId, setSelectedRectId] = React.useState<string>();

  const [ignoreAreas, setIgnoreAreas] = React.useState<IgnoreArea[]>(
    JSON.parse(testRun.ignoreAreas)
  );

  React.useEffect(() => {
    setIgnoreAreas(JSON.parse(testRun.ignoreAreas));
  }, [testRun]);

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
                      updateTestRun(testRun);
                    })
                  }
                >
                  Approve
                </Button>
                <Button
                  color="secondary"
                  onClick={() =>
                    testRunService
                      .reject(testRun.id)
                      .then((testRun) => updateTestRun(testRun))
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
        <Grid container>
          <Grid item>
            <Paper variant="outlined">
              <TestRunDetails testRun={testRun} />
            </Paper>
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
                  <IconButton
                    onClick={() => {
                      const newArea: IgnoreArea = {
                        id: Date.now().toString(),
                        x: 0,
                        y: 0,
                        width: 150,
                        height: 100,
                      };
                      setIgnoreAreas([...ignoreAreas, newArea]);
                    }}
                  >
                    <Add />
                  </IconButton>
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
                        .then((testRun) => updateTestRun(testRun));

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
                  <IconButton onClick={() => fitStageToScreen()}>
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
          <Grid container>
            <Grid item>
              <ImageDetails type="Baseline" imageName={testRun.baselineName} />
            </Grid>
            <Grid item className={classes.canvasContainer}>
              <DrawArea
                image={baseline}
                ignoreAreas={[]}
                setIgnoreAreas={setIgnoreAreas}
                selectedRectId={selectedRectId}
                setSelectedRectId={setSelectedRectId}
                onStageClick={removeSelection}
                stageScaleState={[stageScale, setStageScale]}
                stagePosState={[stagePos, setStagePos]}
                stageInitPosState={[stageInitPos, setStageInitPos]}
                stageOffsetState={[stageOffset, setStageOffset]}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={6} className={classes.imageContainer}>
          <Grid container>
            {isDiffShown ? (
              <React.Fragment>
                <Grid item>
                  <ImageDetails type="Diff" imageName={testRun.diffName} />
                </Grid>
                <Grid item className={classes.canvasContainer}>
                  <DrawArea
                    image={diff}
                    ignoreAreas={ignoreAreas}
                    setIgnoreAreas={setIgnoreAreas}
                    selectedRectId={selectedRectId}
                    setSelectedRectId={setSelectedRectId}
                    onStageClick={removeSelection}
                    stageScaleState={[stageScale, setStageScale]}
                    stagePosState={[stagePos, setStagePos]}
                    stageInitPosState={[stageInitPos, setStageInitPos]}
                    stageOffsetState={[stageOffset, setStageOffset]}
                  />
                </Grid>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Grid item>
                  <ImageDetails type="Image" imageName={testRun.imageName} />
                </Grid>
                <Grid item className={classes.canvasContainer}>
                  <DrawArea
                    image={image}
                    ignoreAreas={ignoreAreas}
                    setIgnoreAreas={setIgnoreAreas}
                    selectedRectId={selectedRectId}
                    setSelectedRectId={setSelectedRectId}
                    onStageClick={removeSelection}
                    stageScaleState={[stageScale, setStageScale]}
                    stagePosState={[stagePos, setStagePos]}
                    stageInitPosState={[stageInitPos, setStageInitPos]}
                    stageOffsetState={[stageOffset, setStageOffset]}
                  />
                </Grid>
              </React.Fragment>
            )}
          </Grid>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default TestDetailsModal;
