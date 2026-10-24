import { IconButton } from "@mui/material";
import { NavigateNext, NavigateBefore } from "@mui/icons-material";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TestRun } from "../../types";
import { Tooltip } from "../Tooltip";

const buttonSx = {
  width: 64,
  height: 64,
  padding: 0,
  position: "fixed",
  top: "50%",
  zIndex: 4000,
} as const;

const iconSx = {
  width: 64,
  height: 64,
} as const;

export const ArrowButtons: React.FunctionComponent<{
  testRuns: TestRun[];
  selectedTestRunIndex: number;
  handleNavigation: (testRunId: string) => void;
}> = ({ testRuns, selectedTestRunIndex, handleNavigation }) => {
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
            sx={buttonSx}
            style={{
              right: 0,
            }}
            onClick={navigateNext}
            size="large"
          >
            <NavigateNext sx={iconSx} />
          </IconButton>
        </Tooltip>
      )}
      {selectedTestRunIndex > 0 && (
        <Tooltip title={"Hotkey: ArrowLeft"}>
          <IconButton
            color="secondary"
            sx={buttonSx}
            style={{
              left: 0,
            }}
            onClick={navigateBefore}
            size="large"
          >
            <NavigateBefore sx={iconSx} />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};
