import { createContext } from 'react';
import { Step } from 'react-joyride';

let helpSteps: Step[] = [];

let getHelpSteps = (): Step[] => {
    const firstStep = helpSteps[0];
    //Below line is to prevent application breaking if element is not present for any reason (e.g. if the user deletes build or if there is no data.)
    if (firstStep && document.getElementById(firstStep.target.toString().slice(1))) {
        helpSteps.every((e) => {
            e.disableBeacon = true;
            e.hideCloseButton = true;
        });
        return helpSteps;
    }
    return [];
};

const populateHelpSteps = (steps: any) => {
    helpSteps = steps;
};

export const HelpContext = createContext({ getHelpSteps, populateHelpSteps });
