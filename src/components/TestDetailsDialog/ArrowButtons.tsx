import { IconButton } from "@mui/material";
import { NavigateNext, NavigateBefore } from "@mui/icons-material";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TestRun } from "../../types";
import { Tooltip } from "../Tooltip";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
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
    if (testRuns.length > selectedTestRunIndex + 1) {
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
    <>
      {testRuns.length > selectedTestRunIndex + 1 && (
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
    </>
  );
};
