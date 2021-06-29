import React from "react";
import { Build, PaginatedData } from "../types";
import { buildsService } from "../services";
import {
  buildTestRunLocation,
  getQueryParams,
} from "../_helpers/route.helpers";
import { useHistory, useLocation } from "react-router-dom";

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
  payload: Array<Build>;
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
          selectedBuildId: null,
          selectedBuild: null,
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
      {
        let buildList = state.buildList;
        let indexOfBuildDeleted = buildList.findIndex(
          (e) => e.id === action.payload
        );
        let indexOfSelectedBuild = buildList.findIndex(
          (e) => e.id === state.selectedBuildId
        );
        if (indexOfBuildDeleted === indexOfSelectedBuild) {
          let buildToSelect = null;
          if (buildList.length > 1) {
            buildToSelect = (buildList.length === 0) ? buildList[1] : buildList[indexOfSelectedBuild - 1];
          }
          state.selectedBuild = buildToSelect;
          state.selectedBuildId = buildToSelect?.id ?? null;
        }
        return {
          ...state,
          buildList: state.buildList.filter((p) => p.id !== action.payload),
        };
      }
    case "add":
      return {
        ...state,
        buildList: [action.payload, ...state.buildList],
      };
    case "update":
      return {
        ...state,
        selectedBuild:
          action.payload.find((i) => i.id === state.selectedBuild?.id) ??
          state.selectedBuild,
        buildList: state.buildList.map((b) => {
          const item = action.payload.find((i) => i.id === b.id);
          if (item) {
            return item;
          }
          return b;
        }),
      };
    default:
      return state;
  }
}

function BuildProvider({ children }: BuildProviderProps) {
  const [state, dispatch] = React.useReducer(buildReducer, initialState);
  const location = useLocation();
  const history = useHistory();

  // get id from url in case none in state
  React.useEffect(() => {
    const idFromUrl = getQueryParams(location.search).buildId;
    if (!state.selectedBuildId && idFromUrl) {
      selectBuild(dispatch, idFromUrl);
    }
    // eslint-disable-next-line
  }, []);

  // update url
  React.useEffect(() => {
    if (state.selectedBuildId) {
      history.push(buildTestRunLocation(state.selectedBuildId));
    }
  }, [history, state.selectedBuildId]);

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

async function updateBuild(dispatch: Dispatch, builds: Array<Build>) {
  dispatch({ type: "update", payload: builds });
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
};
