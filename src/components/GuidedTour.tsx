import React, { FunctionComponent } from "react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";
import { Button } from "@mui/material";
import { useHelpState } from "../contexts";
import { LiveHelp } from "@mui/icons-material";
import { TAKE_TOUR_BUTTON_TEST_ID } from "./GuidedTour.locators";
import { brand } from "../theme/tokens";

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
          // the theme's CSS variables, so the tour follows the colour mode
          options: {
            zIndex: 10000,
            // joyride derives the beacon's tint from this, so it needs a hex
            primaryColor: brand[700],
            backgroundColor: "var(--mui-palette-background-paper)",
            textColor: "var(--mui-palette-text-primary)",
            arrowColor: "var(--mui-palette-background-paper)",
          },
          buttonNext: {
            color: "var(--mui-palette-primary-main)",
            backgroundColor: "",
          },
          buttonBack: {
            color: "var(--mui-palette-primary-main)",
          },
        }}
      />
      Take a tour
    </Button>
  );
};

export default GuidedTour;
