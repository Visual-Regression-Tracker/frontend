import React, { FunctionComponent } from "react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";
import { IconButton, Avatar } from "@material-ui/core";
import { HelpOutline } from "@material-ui/icons";
import { useHelpState } from "../contexts";

const GuidedTour: FunctionComponent = () => {
  const [run, setRun] = React.useState(false);
  const { helpSteps } = useHelpState();

  const getHelpSteps = React.useCallback(() => {
    const firstStep = helpSteps[0];
    //Below line is to prevent application breaking if element is not present for any reason (e.g. if the user deletes build or if there is no data.)
    if (
      firstStep &&
      document.getElementById(firstStep.target.toString().slice(1))
    ) {
      helpSteps.forEach((e) => {
        e.disableBeacon = true;
        e.hideCloseButton = true;
      });
      return helpSteps;
    }
    return [];
  }, [helpSteps]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
    }
  };

  const handleClickStart = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setRun(true);
  };

  return (
    <React.Fragment>
      <IconButton onClick={handleClickStart}>
        <Avatar>
          <HelpOutline />
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
              buttonNext: { color: "#3f51b5", backgroundColor: "" },
              buttonBack: { color: "#3f51b5" },
            }}
          />
        </Avatar>
      </IconButton>
    </React.Fragment>
  );
};

export default GuidedTour;
