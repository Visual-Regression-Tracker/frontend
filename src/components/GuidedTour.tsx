import React, { FunctionComponent } from "react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";
import { Button } from "@mui/material";
import { useHelpState } from "../contexts";
import { LiveHelp } from "@mui/icons-material";
import GuidedTourJoyrideTooltip from "./GuidedTourJoyrideTooltip";

const GuidedTour: FunctionComponent = () => {
  const [run, setRun] = React.useState(false);
  const { helpSteps } = useHelpState();

  const getHelpSteps = React.useCallback(() => {
    const [firstStep] = helpSteps;

    //Below line is to prevent application breaking if element is not present for any reason (e.g. if the user deletes build or if there is no data.)
    if (
      firstStep &&
      document.getElementById(firstStep.target.toString().slice(1))
    ) {
      for (const step of helpSteps) {
        step.disableBeacon = true;
        step.hideCloseButton = true;
      }

      return helpSteps;
    }

    return [];
  }, [helpSteps]);

  const handleJoyrideCallback = ({ status }: CallBackProps) => {
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
    }
  };

  const handleClickStart = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setRun(true);
  };

  return (
    <React.Fragment>
      <Button startIcon={<LiveHelp />} onClick={handleClickStart}>
        <Joyride
          tooltipComponent={GuidedTourJoyrideTooltip}
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
          }}
        />
        Take a tour
      </Button>
    </React.Fragment>
  );
};

export default GuidedTour;
