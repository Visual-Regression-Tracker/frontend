import { createContext } from 'react';

let helpSteps: any[] = [];

let getHelpSteps = () => {
    const firstStep = helpSteps[0];
    //Below line is to prevent application breaking if element is not present for any reason (e.g. if the user deletes build or if there is no data.)
    if (firstStep && document.getElementById(firstStep.target.slice(1))) {
        return helpSteps;
    }
    return [];
};

const populateHelpSteps = (steps: any) => {
    helpSteps = steps;
};

export const HelpContext = createContext({ getHelpSteps, populateHelpSteps });
