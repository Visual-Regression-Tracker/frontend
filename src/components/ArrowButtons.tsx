import { IconButton, makeStyles, Tooltip } from "@material-ui/core";
import { NavigateNext, NavigateBefore } from "@material-ui/icons";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useHistory } from "react-router-dom";
import { useTestRunDispatch, selectTestRun } from "../contexts";
import { TestRun } from "../types";
import { buildTestRunLocation } from "../_helpers/route.helpers";

const useStyles = makeStyles((theme) => ({
  button: {
    width: 64,
    height: 64,
    padding: 0,
    position: "fixed",
    top: "50%",
    zIndex: 4000,
  },
  icon: {
    width: 64,
    height: 64,
  },
}));

export const ArrowButtons: React.FunctionComponent<{
  testRuns: TestRun[];
  selectedTestRunIndex: number;
}> = ({ testRuns, selectedTestRunIndex }) => {
  const classes = useStyles();
  const history = useHistory();
  const testRunDispatch = useTestRunDispatch();

  const navigateNext = () => {
    if (selectedTestRunIndex + 1 < testRuns.length) {
      const next = testRuns[selectedTestRunIndex + 1];
      history.push(buildTestRunLocation(next.buildId, next.id));
      selectTestRun(testRunDispatch, next.id);
    }
  };
  useHotkeys("right", navigateNext, [selectedTestRunIndex]);

  const navigateBefore = () => {
    if (selectedTestRunIndex > 0) {
      const prev = testRuns[selectedTestRunIndex - 1];
      history.push(buildTestRunLocation(prev.buildId, prev.id));
      selectTestRun(testRunDispatch, prev.id);
    }
  };
  useHotkeys("left", navigateBefore, [selectedTestRunIndex]);

  return (
    <React.Fragment>
      {selectedTestRunIndex + 1 < testRuns.length && (
        <Tooltip title={"Hotkey: ArrowRight"}>
          <IconButton
            color="secondary"
            className={classes.button}
            style={{
              right: 0,
            }}
            onClick={navigateNext}
          >
            <NavigateNext className={classes.icon} />
          </IconButton>
        </Tooltip>
      )}
      {selectedTestRunIndex > 0 && (
        <Tooltip title={"Hotkey: ArrowLeft"}>
          <IconButton
            color="secondary"
            className={classes.button}
            style={{
              left: 0,
            }}
            onClick={navigateBefore}
          >
            <NavigateBefore className={classes.icon} />
          </IconButton>
        </Tooltip>
      )}
    </React.Fragment>
  );
};
