import { IconButton } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { NavigateNext, NavigateBefore } from "@mui/icons-material";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TestRun } from "../../types";
import { Tooltip } from "../Tooltip";

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
  handleNavigation: (testRunId: string) => void;
}> = ({ testRuns, selectedTestRunIndex, handleNavigation }) => {
  const classes = useStyles();

  const navigateNext = () => {
    if (selectedTestRunIndex + 1 < testRuns.length) {
      const next = testRuns[selectedTestRunIndex + 1];
      handleNavigation(next.id);
    }
  };

  const navigateBefore = () => {
    if (selectedTestRunIndex > 0) {
      const prev = testRuns[selectedTestRunIndex - 1];
      handleNavigation(prev.id);
    }
  };

  useHotkeys("right", navigateNext, [selectedTestRunIndex, handleNavigation]);
  useHotkeys("left", navigateBefore, [selectedTestRunIndex, handleNavigation]);

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
            size="large"
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
            size="large"
          >
            <NavigateBefore className={classes.icon} />
          </IconButton>
        </Tooltip>
      )}
    </React.Fragment>
  );
};
