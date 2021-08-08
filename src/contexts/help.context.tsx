import React from "react";
import { Step } from "react-joyride";

interface ISetStepAction {
  type: "setSteps";
  payload: Array<Step>;
}

type IAction = ISetStepAction;

type Dispatch = (action: IAction) => void;
type State = {
  helpSteps: Array<Step>;
};

type HelpProviderProps = { children: React.ReactNode };

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

const initialState: State = {
  helpSteps: [],
};

function reducer(state: State, action: IAction): State {
  switch (action.type) {
    case "setSteps":
      return {
        ...state,
        helpSteps: action.payload,
      };
    default:
      return state;
  }
}

function HelpProvider({ children }: HelpProviderProps) {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

function useHelpState() {
  const context = React.useContext(StateContext);
  if (context === undefined) {
    throw new Error("must be used within a HelpContext");
  }
  return context;
}

function useHelpDispatch() {
  const context = React.useContext(DispatchContext);
  if (context === undefined) {
    throw new Error("must be used within a HelpContext");
  }
  return context;
}

function setHelpSteps(dispatch: Dispatch, data: Array<Step>) {
  dispatch({ type: "setSteps", payload: data });
}

export { HelpProvider, useHelpDispatch, useHelpState, setHelpSteps };
