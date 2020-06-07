import React from "react";
import { Build } from "../types";
import { buildsService } from "../services";

interface IRequestAction {
  type: "request";
  payload?: undefined;
}

interface IGetAction {
  type: "get";
  payload: Build[];
}

interface ISelectAction {
  type: "select";
  payload: string;
}

interface IDeleteAction {
  type: "delete";
  payload: string;
}

interface IAddAction {
  type: "add";
  payload: Build;
}

type IAction =
  | IRequestAction
  | IGetAction
  | IDeleteAction
  | IAddAction
  | ISelectAction;

type Dispatch = (action: IAction) => void;
type State = {
  selectedBuildId: string | undefined;
  buildList: Build[];
};

type BuildProviderProps = { children: React.ReactNode };

const BuildStateContext = React.createContext<State | undefined>(undefined);
const BuildDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

const initialState: State = {
  selectedBuildId: undefined,
  buildList: [],
};

function buildReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "select":
      return {
        ...state,
        selectedBuildId: action.payload,
      };
    case "get":
      return {
        ...state,
        buildList: action.payload,
      };
    case "delete":
      return {
        ...state,
        buildList: state.buildList.filter((p) => p.id !== action.payload),
      };
    case "add":
      console.log(action.payload);
      return {
        ...state,
        buildList: [action.payload, ...state.buildList],
      };
    default:
      return state;
  }
}

function BuildProvider({ children }: BuildProviderProps) {
  const [state, dispatch] = React.useReducer(buildReducer, initialState);

  return (
    <BuildStateContext.Provider value={state}>
      <BuildDispatchContext.Provider value={dispatch}>
        {children}
      </BuildDispatchContext.Provider>
    </BuildStateContext.Provider>
  );
}

function useBuildState() {
  const context = React.useContext(BuildStateContext);
  if (context === undefined) {
    throw new Error("must be used within a BuildProvider");
  }
  return context;
}

function useBuildDispatch() {
  const context = React.useContext(BuildDispatchContext);
  if (context === undefined) {
    throw new Error("must be used within a BuildProvider");
  }
  return context;
}

async function getBuildList(dispatch: Dispatch, id: string) {
  dispatch({ type: "request" });

  buildsService
    .getList(id)
    .then((items) => {
      dispatch({ type: "get", payload: items });
    })
    .catch((error) => {
      console.log(error.toString());
    });
}

async function deleteBuild(dispatch: Dispatch, id: string) {
  dispatch({ type: "request" });

  buildsService
    .remove(id)
    .then((isDeleted) => {
      if (isDeleted) {
        dispatch({ type: "delete", payload: id });
      }
    })
    .catch((error) => {
      console.log(error.toString());
    });
}

async function selectBuild(dispatch: Dispatch, id: string) {
  dispatch({ type: "select", payload: id });
}

async function addBuild(dispatch: Dispatch, build: Build) {
  dispatch({ type: "add", payload: build });
}

export {
  BuildProvider,
  useBuildState,
  useBuildDispatch,
  getBuildList,
  deleteBuild,
  selectBuild,
  addBuild,
};
