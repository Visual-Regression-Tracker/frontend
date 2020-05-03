import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Switch,
} from "@material-ui/core";
import { TestRun } from "../types";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { testsService } from "../services";
import DrawArea from "../components/DrawArea";
import { TestStatus } from "../types/testStatus";
import { useParams } from "react-router-dom";
import { IgnoreArea } from "../types/ignoreArea";
import { KonvaEventObject } from "konva/types/Node";
import { TestVariation } from "../types/testVariation";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    appBar: {
      position: "relative",
    },
  })
);

const TestDetailsModal = () => {
  const { testId } = useParams();
  const classes = useStyles();
  const [test, setTest] = useState<TestRun>({
    id: "",
    buildId: 0,
    imageName: "",
    diffName: "",
    status: TestStatus.unresolved,
    testVariation: {
      id: "",
      name: "",
      baselineName: "",
      os: "",
      browser: "",
      viewport: "",
      device: "",
      ignoreAreas: "[]",
    },
  });
  const [variation, setVariation] = useState<TestVariation>({
    id: "",
    name: "",
    baselineName: "",
    os: "",
    browser: "",
    viewport: "",
    device: "",
    ignoreAreas: "[]",
  });
  const [ignoreAreas, setIgnoreAreas] = React.useState<IgnoreArea[]>([]);
  const [isDiffShown, setIsDiffShown] = useState(false);
  const [selectedRectId, setSelectedRectId] = React.useState<string>();

  const removeSelection = (event: KonvaEventObject<MouseEvent>) => {
    // deselect when clicked not on Rect
    const isRectClicked = event.target.className === "Rect";
    if (!isRectClicked) {
      setSelectedRectId(undefined);
    }
  };

  const stageWidth = (window.innerWidth / 2) * 0.95;
  const stageHeigth = window.innerHeight;

  useEffect(() => {
    if (testId) {
      testsService.get(testId).then((test) => {
        setTest(test);
        setVariation(test.testVariation);
        setIgnoreAreas(JSON.parse(test.testVariation.ignoreAreas));
      });
    }
  }, [testId]);

  const deleteIgnoreArea = (id: string) => {
    setIgnoreAreas(ignoreAreas.filter((area) => area.id !== id));
    setSelectedRectId(undefined);
  };

  return (
    <React.Fragment>
      <AppBar className={classes.appBar}>
        <Toolbar>
          <Grid container justify="space-between">
            <Grid item>
              <Typography variant="h6">{variation.name}</Typography>
            </Grid>
            {test.status === TestStatus.unresolved && (
              <Grid item>
                <Switch
                  checked={isDiffShown}
                  onChange={() => setIsDiffShown(!isDiffShown)}
                  name="Show diff"
                />
              </Grid>
            )}
            {(test.status === TestStatus.unresolved ||
              test.status === TestStatus.new) && (
              <Grid item>
                <Button
                  color="inherit"
                  onClick={() =>
                    testsService.approve(test.id).then((test) => {
                      setVariation(test.testVariation);
                      setTest(test);
                    })
                  }
                >
                  Approve
                </Button>
                <Button
                  color="secondary"
                  onClick={() =>
                    testsService.reject(test.id).then((test) => setTest(test))
                  }
                >
                  Reject
                </Button>
              </Grid>
            )}
            <Grid item>
              <Button
                color="inherit"
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
                Add ignore area
              </Button>
              {selectedRectId && (
                <Button
                  color="secondary"
                  onClick={() => deleteIgnoreArea(selectedRectId)}
                >
                  Delete ignore area
                </Button>
              )}
            </Grid>
            <Grid item>
              <Button
                color="inherit"
                onClick={() => {
                  testsService.setIgnoreAreas(variation.id, ignoreAreas);
                }}
              >
                Save
              </Button>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <Grid container>
        <Grid item xs={6}>
          <DrawArea
            width={stageWidth}
            height={stageHeigth}
            imageUrl={variation.baselineName}
            ignoreAreas={[]}
            setIgnoreAreas={setIgnoreAreas}
            selectedRectId={selectedRectId}
            setSelectedRectId={setSelectedRectId}
            onStageClick={removeSelection}
          />
        </Grid>
        <Grid item xs={6}>
          {isDiffShown ? (
            <DrawArea
              width={stageWidth}
              height={stageHeigth}
              imageUrl={test.diffName}
              ignoreAreas={ignoreAreas}
              setIgnoreAreas={setIgnoreAreas}
              selectedRectId={selectedRectId}
              setSelectedRectId={setSelectedRectId}
              onStageClick={removeSelection}
            />
          ) : (
            <DrawArea
              width={stageWidth}
              height={stageHeigth}
              imageUrl={test.imageName}
              ignoreAreas={ignoreAreas}
              setIgnoreAreas={setIgnoreAreas}
              selectedRectId={selectedRectId}
              setSelectedRectId={setSelectedRectId}
              onStageClick={removeSelection}
            />
          )}
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default TestDetailsModal;
