import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import type { Step } from "react-joyride";

interface ISetStepAction {
  type: "setSteps";
  payload: Step[];
}

type Dispatch = (action: ISetStepAction) => void;
type State = {
  helpSteps: Step[];
};
type HelpProviderProps = {
  children: ReactNode;
};

const StateContext = createContext<State | undefined>(undefined);
const DispatchContext = createContext<Dispatch | undefined>(undefined);

const initialState: State = {
  helpSteps: [],
};

export function reducer(state: State, action: ISetStepAction): State {
  if (action.type === "setSteps") {
    return {
      ...state,
      helpSteps: action.payload,
    };
  }
  return state;
}

function HelpProvider({ children }: Readonly<HelpProviderProps>) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

function useHelpState() {
  const context = useContext(StateContext);

  if (context === undefined) {
    throw Error("must be used within a HelpContext");
  }

  return context;
}

function useHelpDispatch() {
  const context = useContext(DispatchContext);

  if (context === undefined) {
    throw Error("must be used within a HelpContext");
  }

  return context;
}

function setHelpSteps(dispatch: Dispatch, data: Step[]) {
  dispatch({
    type: "setSteps",
    payload: data,
  });
}

function useHelpSteps(steps: Step[]) {
  const dispatch = useHelpDispatch();
  useEffect(() => {
    setHelpSteps(dispatch, steps);
  });
}

export {
  HelpProvider,
  useHelpDispatch,
  useHelpState,
  useHelpSteps,
  setHelpSteps,
};
