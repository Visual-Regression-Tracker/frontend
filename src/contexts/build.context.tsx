import React from "react";
import { Build, PaginatedData } from "../types";
import { buildsService } from "../services";
import { useLocation } from "react-router-dom";
import { getQueryParams } from "../_helpers/route.helpers";

interface IRequestAction {
  type: "request";
}

interface IResetAction {
  type: "reset";
}

interface IFailureAction {
  type: "failure";
  payload: string;
}

interface IGetAction {
  type: "get";
  payload: PaginatedData<Build>;
}

interface ISelectAction {
  type: "select";
  payload?: Build;
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
  payload: Build[];
}

type IAction =
  | IRequestAction
  | IResetAction
  | IFailureAction
  | IGetAction
  | IDeleteAction
  | IAddAction
  | IUpdateAction
  | ISelectAction;
type Dispatch = (action: IAction) => void;
type State = {
  selectedBuild?: Build;
  buildList: Build[];
  total: number;
  take: number;
  skip: number;
  loading: boolean;
  // why the last fetch failed, until the next one starts
  error?: string;
};
type BuildProviderProps = {
  children: React.ReactNode;
};

const BuildStateContext = React.createContext<State | undefined>(undefined);
const BuildDispatchContext = React.createContext<Dispatch | undefined>(
  undefined,
);

const initialState: State = {
  buildList: [],
  take: 10,
  skip: 0,
  total: 0,
  loading: false,
};

export function buildReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "select":
      return {
        ...state,
        selectedBuild: action.payload,
      };

    // keeps the current items on screen so refetching does not flash the skeletons
    case "request":
      return {
        ...state,
        loading: true,
        error: undefined,
      };

    case "reset":
      return {
        ...state,
        buildList: [],
        total: 0,
        loading: true,
        error: undefined,
      };

    // a failed fetch has to end the loading too, or the skeletons stay forever
    case "failure":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case "get":
      // eslint-disable-next-line no-case-declarations
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
  const { buildId } = getQueryParams(location.search);

  React.useEffect(() => {
    // switching builds moves the URL faster than the answers come back, and
    // only the build the URL names now may be shown
    let ignore = false;
    selectBuild(dispatch, buildId, () => !ignore);
    return () => {
      ignore = true;
    };
  }, [buildId]);

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
    throw Error("must be used within a BuildProvider");
  }

  return context;
}

function useBuildDispatch() {
  const context = React.useContext(BuildDispatchContext);

  if (context === undefined) {
    throw Error("must be used within a BuildProvider");
  }

  return context;
}

function deleteBuild(dispatch: Dispatch, id: string) {
  return buildsService.remove(id).then((build) => {
    dispatch({
      type: "delete",
      payload: id,
    });
    return build;
  });
}

// isCurrent lets a caller drop an answer that has been overtaken
function selectBuild(
  dispatch: Dispatch,
  id?: string,
  isCurrent: () => boolean = () => true,
) {
  if (!id) {
    dispatch({
      type: "select",
    });
  } else {
    return (
      buildsService
        .getDetails(id)
        .then((build) => {
          if (isCurrent()) {
            dispatch({
              type: "select",
              payload: build,
            });
          }
        })
        // a deleted build's link: close rather than keep the previous build open
        .catch(() => {
          if (isCurrent()) {
            dispatch({
              type: "select",
            });
          }
        })
    );
  }
}

function addBuild(dispatch: Dispatch, build: Build) {
  dispatch({
    type: "add",
    payload: build,
  });
}

function updateBuild(dispatch: Dispatch, builds: Build[]) {
  dispatch({
    type: "update",
    payload: builds,
  });
}

export {
  BuildProvider,
  useBuildState,
  useBuildDispatch,
  deleteBuild,
  selectBuild,
  addBuild,
  updateBuild,
};
