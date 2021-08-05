import React, { useContext, FunctionComponent } from "react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";
import { IconButton, Avatar, } from "@material-ui/core";
import { HelpOutline } from "@material-ui/icons";
import { HelpContext } from "../contexts/help.context";

const GuidedTour: FunctionComponent = () => {
    const [run, setRun] = React.useState(false);

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

    const { getHelpSteps } = useContext(HelpContext);

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
                        styles={{
                            options: {
                                zIndex: 10000,
                            },
                        }}
                    />
                </Avatar>
            </IconButton>
        </React.Fragment>
    );
}

export default GuidedTour;
