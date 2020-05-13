import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Switch,
  IconButton,
} from "@material-ui/core";
import { TestRun } from "../types";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { testsService } from "../services";
import DrawArea from "./DrawArea";
import { TestStatus } from "../types/testStatus";
import { useHistory } from "react-router-dom";
import { IgnoreArea } from "../types/ignoreArea";
import { KonvaEventObject } from "konva/types/Node";
import { TestVariation } from "../types/testVariation";
import { Close } from "@material-ui/icons";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    appBar: {
      position: "relative",
    },
  })
);

const TestDetailsModal: React.FunctionComponent<{
  details: TestRun;
  updateTestRun: (testRun: TestRun) => void;
}> = ({ details, updateTestRun }) => {
  const history = useHistory();
  const classes = useStyles();

  const [testRun, setTestRun] = useState<TestRun>(details);
  const [testVariation, setTestVariation] = useState<TestVariation>(
    details.testVariation
  );
  const [ignoreAreas, setIgnoreAreas] = React.useState<IgnoreArea[]>(
    JSON.parse(details.testVariation.ignoreAreas)
  );
  const [isDiffShown, setIsDiffShown] = useState(false);
  const [selectedRectId, setSelectedRectId] = React.useState<string>();

  const removeSelection = (event: KonvaEventObject<MouseEvent>) => {
    // deselect when clicked not on Rect
    const isRectClicked = event.target.className === "Rect";
    if (!isRectClicked) {
      setSelectedRectId(undefined);
    }
  };

  const stageWidth = (window.innerWidth / 2) * 0.9;
  const stageHeigth = window.innerHeight;

  const deleteIgnoreArea = (id: string) => {
    setIgnoreAreas(ignoreAreas.filter((area) => area.id !== id));
    setSelectedRectId(undefined);
  };

  const handleClose = () => {
    updateTestRun({
      ...testRun,
      testVariation: {
        ...testVariation,
        ignoreAreas: JSON.stringify(ignoreAreas),
      },
    });
    history.push({
      search: `buildId=${testRun.buildId}`,
    });
  };

  return (
    <React.Fragment>
      <AppBar className={classes.appBar}>
        <Toolbar>
          <Grid container justify="space-between">
            <Grid item>
              <Typography variant="h6">{testVariation.name}</Typography>
            </Grid>
            {testRun.status === TestStatus.unresolved && (
              <Grid item>
                <Switch
                  checked={isDiffShown}
                  onChange={() => setIsDiffShown(!isDiffShown)}
                  name="Show diff"
                />
              </Grid>
            )}
            {(testRun.status === TestStatus.unresolved ||
              testRun.status === TestStatus.new) && (
              <Grid item>
                <Button
                  color="inherit"
                  onClick={() =>
                    testsService.approve(testRun.id).then((test) => {
                      setTestVariation(test.testVariation);
                      setTestRun(test);
                    })
                  }
                >
                  Approve
                </Button>
                <Button
                  color="secondary"
                  onClick={() =>
                    testsService
                      .reject(testRun.id)
                      .then((test) => setTestRun(test))
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
                  testsService.setIgnoreAreas(testVariation.id, ignoreAreas);
                }}
              >
                Save
              </Button>
            </Grid>
            <Grid item>
              <IconButton color="inherit" onClick={handleClose}>
                <Close />
              </IconButton>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <Grid container>
        <Grid item xs={6}>
          <DrawArea
            width={stageWidth}
            height={stageHeigth}
            imageUrl={testVariation.baselineName}
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
              imageUrl={testRun.diffName}
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
              imageUrl={testRun.imageName}
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
