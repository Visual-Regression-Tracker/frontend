import React from "react";
import { Build, TestRun } from "../types";
import { buildsService } from "../services";
import { TestStatus } from "../types/testStatus";

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

interface IUpdateAction {
  type: "update";
  payload: TestRun;
}

interface IStatsAction {
  type: "stats";
  payload: string;
}

type IAction =
  | IRequestAction
  | IGetAction
  | IDeleteAction
  | ISelectAction
  | IStatsAction
  | IUpdateAction;

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
    case "stats":
      return {
        ...state,
        buildList: state.buildList.map((build) => {
          if (build.id === action.payload) {
            // reset stats
            build.passedCount = 0;
            build.unresolvedCount = 0;
            build.failedCount = 0;

            // calculate stats
            build.testRuns.forEach((testRun) => {
              switch (testRun.status) {
                case TestStatus.approved:
                case TestStatus.ok: {
                  build.passedCount += 1;
                  break;
                }
                case TestStatus.unresolved:
                case TestStatus.new: {
                  build.unresolvedCount += 1;
                  break;
                }
                case TestStatus.failed: {
                  build.failedCount += 1;
                  break;
                }
              }
            });
          }
          return build;
        }),
      };
    case "update":
      return {
        ...state,
        buildList: state.buildList.map((build) => {
          if (build.id === action.payload.buildId) {
            return {
              ...build,
              testRuns: build.testRuns.map((testRun) => {
                if (testRun.id === action.payload.id) {
                  return action.payload;
                }
                return testRun;
              }),
            };
          }
          return build;
        }),
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
      items.forEach((build) => dispatch({ type: "stats", payload: build.id }));
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

async function updateBuild(dispatch: Dispatch, testRun: TestRun) {
  dispatch({ type: "update", payload: testRun });
  dispatch({ type: "stats", payload: testRun.buildId });
}

export {
  BuildProvider,
  useBuildState,
  useBuildDispatch,
  getBuildList,
  deleteBuild,
  selectBuild,
  updateBuild,
};
