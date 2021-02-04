import React from "react";
import { Build, PaginatedData } from "../types";
import { buildsService } from "../services";

interface IRequestAction {
  type: "request";
  payload?: undefined;
}

interface IGetAction {
  type: "get";
  payload: PaginatedData<Build>;
}

interface ISelectAction {
  type: "select";
  payload: Build | null;
}

interface IDeleteAction {
  type: "delete";
  payload: string;
}

interface IAddAction {
  type: "add";
  payload: Build;
}

interface IUpdateAction {
  type: "update";
  payload: Build;
}

type IAction =
  | IRequestAction
  | IGetAction
  | IDeleteAction
  | IAddAction
  | IUpdateAction
  | ISelectAction;

type Dispatch = (action: IAction) => void;
type State = {
  selectedBuildId: string | null;
  selectedBuild: Build | null;
  buildList: Build[];
  total: number;
  take: number;
  skip: number;
  loading: boolean;
};

type BuildProviderProps = { children: React.ReactNode };

const BuildStateContext = React.createContext<State | undefined>(undefined);
const BuildDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

const initialState: State = {
  selectedBuildId: null,
  selectedBuild: null,
  buildList: [],
  take: 10,
  skip: 0,
  total: 0,
  loading: false,
};

function buildReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "select":
      if (action.payload === null) {
        return {
          ...state,
          selectedBuild: null
        };
      } else {
        return {
          ...state,
          selectedBuildId: action.payload.id,
          selectedBuild: action.payload,
        };
      }
    case "request":
      return {
        ...state,
        buildList: [],
        loading: true,
      };
    case "get":
      const { data, take, skip, total } = action.payload;
      return {
        ...state,
        buildList: data,
        take,
        skip,
        total,
        loading: false,
      };
    case "delete":
      return {
        ...state,
        buildList: state.buildList.filter((p) => p.id !== action.payload),
      };
    case "add":
      return {
        ...state,
        buildList: [action.payload, ...state.buildList],
      };
    case "update":
      return {
        ...state,
        selectedBuild:
          state.selectedBuild?.id === action.payload.id
            ? action.payload
            : state.selectedBuild,
        buildList: state.buildList.map((p) => {
          if (p.id === action.payload.id) {
            return action.payload;
          }
          return p;
        }),
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

async function getBuildList(dispatch: Dispatch, id: string, page: number) {
  dispatch({ type: "request" });

  return buildsService
    .getList(id, initialState.take, initialState.take * (page - 1))
    .then((response) => {
      dispatch({ type: "get", payload: response });
    });
}

async function deleteBuild(dispatch: Dispatch, id: string) {
  return buildsService.remove(id).then((build) => {
    dispatch({ type: "delete", payload: id });
    return build;
  });
}

async function stopBuild(dispatch: Dispatch, id: string) {
  return buildsService.update(id, { "isRunning": false }).then((build) => {
    dispatch({ type: "update", payload: build });
    return build;
  });
}

async function selectBuild(dispatch: Dispatch, id: string | null) {
  if (id === null) {
    dispatch({ type: "select", payload: null });
  } else {
    return buildsService.getDetails(id).then((build) => {
      dispatch({ type: "select", payload: build });
    });
  }
}

async function addBuild(dispatch: Dispatch, build: Build) {
  dispatch({ type: "add", payload: build });
}

async function modifyBuild(dispatch: Dispatch, id: string, body: object) {
  return buildsService.update(id, body);
}

async function updateBuild(dispatch: Dispatch, build: Build) {
  dispatch({ type: "update", payload: build });
}

export {
  BuildProvider,
  useBuildState,
  useBuildDispatch,
  getBuildList,
  deleteBuild,
  selectBuild,
  addBuild,
  updateBuild,
  modifyBuild,
  stopBuild,
};
