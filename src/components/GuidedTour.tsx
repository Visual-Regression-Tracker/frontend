import React, { FunctionComponent } from "react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";
import { Button } from "@mui/material";
import { useHelpState } from "../contexts";
import { LiveHelp } from "@mui/icons-material";
import { TAKE_TOUR_BUTTON_TEST_ID } from "./GuidedTour.locators";

const GuidedTour: FunctionComponent = () => {
  const [run, setRun] = React.useState(false);
  const { helpSteps } = useHelpState();

  const getHelpSteps = React.useCallback(() => {
    if (!helpSteps?.length) {
      return [];
    }

    for (const step of helpSteps) {
      step.disableBeacon = true;
      step.hideCloseButton = true;
    }

    return helpSteps;
  }, [helpSteps]);

  const handleJoyrideCallback = ({ status }: CallBackProps) => {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
    }
  };

  const handleClickStart = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    const [firstStep] = helpSteps;
    if (firstStep && typeof firstStep.target === "string") {
      const targetId = firstStep.target.startsWith("#")
        ? firstStep.target.slice(1)
        : firstStep.target;

      if (!document.getElementById(targetId)) {
        return;
      }
    }

    setRun(true);
  };

  return (
    <Button
      startIcon={<LiveHelp />}
      onClick={handleClickStart}
      data-testid={TAKE_TOUR_BUTTON_TEST_ID}
    >
      <Joyride
        callback={handleJoyrideCallback}
        continuous={true}
        run={run}
        scrollToFirstStep={true}
        showProgress={true}
        showSkipButton={true}
        steps={getHelpSteps()}
        disableCloseOnEsc={true}
        styles={{
          options: {
            zIndex: 10000,
          },
          buttonNext: {
            color: "#3f51b5",
            backgroundColor: "",
          },
          buttonBack: {
            color: "#3f51b5",
          },
        }}
      />
      Take a tour
    </Button>
  );
};

export default GuidedTour;
